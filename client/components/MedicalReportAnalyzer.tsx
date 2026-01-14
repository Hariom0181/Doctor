import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, Sparkles, Loader2, Upload, FolderOpen, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { aiApiService } from '@/services/aiApi';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface MedicalReportAnalyzerProps {
  patientId: number;
}

export function MedicalReportAnalyzer({ patientId }: MedicalReportAnalyzerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('analyze');

  // Report Analysis States
  const [reportData, setReportData] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'हिंदी (Hindi)' },
    { value: 'marathi', label: 'मराठी (Marathi)' },
    { value: 'gujarati', label: 'ગુજરાતી (Gujarati)' },
    { value: 'tamil', label: 'தமிழ் (Tamil)' },
    { value: 'telugu', label: 'తెలుగు (Telugu)' }
  ];

  // Upload States
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Records States
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ role: string, content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your AI Health Assistant. Ask me any health-related questions!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    loadPatientDocuments();
  }, [patientId]);

  // Load patient documents
  const loadPatientDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const docs = await aiApiService.getPatientDocuments(patientId);
      setPatientDocuments(docs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File",
          description: "Please upload PDF, JPG, or PNG files only",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  // Upload and Extract Text
  const handleUploadAndExtract = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file first",
        variant: "destructive"
      });
      return;
    }
  
    setIsExtracting(true);
  
    try {
      // Create FormData for temporary upload (analysis only, no DB save)
      const formData = new FormData();
      formData.append('document', selectedFile);
  
      const uploadResponse = await fetch('http://localhost:5000/api/documents/extract-only', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('patientToken')}`
          // ----------------------------------------------------------------------------------------------------
        },
        body: formData
      });
  
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Upload failed');
      }
  
      const result = await uploadResponse.json();
      setReportData(result.extractedText);
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Text extracted (file not saved)"
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };
  // Load from existing records
  const handleLoadFromRecords = async () => {
    if (!selectedDocId) {
      toast({
        title: "No Document Selected",
        description: "Please select a document from your records",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);

    try {
      const extractedText = await aiApiService.extractTextFromDocument(parseInt(selectedDocId));
      setReportData(extractedText);

      toast({
        title: "Success",
        description: "Text extracted from your record"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extract text",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Analyze Report
  const handleAnalyze = async () => {
    if (!reportData.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide report data to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis('');

    try {
      const result = await aiApiService.analyzeReport(reportData, selectedLanguage);
      setAnalysis(result);

      toast({
        title: "Analysis Complete",
        description: "Your report has been analyzed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze report",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send Chat Message
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const response = await aiApiService.sendChatMessage(userMsg.content);
      const aiMsg = { role: 'assistant', content: response };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get response",
        variant: "destructive"
      });
    } finally {
      setIsChatting(false);
    }
  };

  const sampleReport = `Hemoglobin: 11.2 g/dL (Low)
Blood Sugar (Fasting): 105 mg/dL
Cholesterol Total: 220 mg/dL (High)
HDL: 35 mg/dL (Low)
LDL: 145 mg/dL (High)
Triglycerides: 180 mg/dL
Blood Pressure: 145/95 mmHg (High)`;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Medical Assistant
              </CardTitle>
              <CardDescription>
                Analyze reports or chat with AI about health questions
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyze">
                <FileText className="w-4 h-4 mr-2" />
                Report Analysis
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Health Chat
              </TabsTrigger>
            </TabsList>

            {/* REPORT ANALYSIS TAB */}
            <TabsContent value="analyze" className="space-y-4">

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setReportData(sampleReport)}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Load Sample
                </Button>

                {/* <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                  <SelectTrigger>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="My Records" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.document_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
              </div>

              {/* Load from Records Button */}
              {selectedDocId && (
                <Button
                  onClick={handleLoadFromRecords}
                  disabled={isExtracting}
                  variant="secondary"
                  className="w-full"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    'Load Selected Record'
                  )}
                </Button>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Response Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Report Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Report Data</label>
                <Textarea
                  placeholder="Paste your lab report or upload a file..."
                  value={reportData}
                  onChange={(e) => setReportData(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!reportData.trim() || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>

              {/* Analysis Results */}
              {analysis && (
                <div className="mt-6 space-y-4">
                  <Badge className="bg-green-600">Analysis Results</Badge>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="space-y-4">
              <div className="border rounded-lg h-[500px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                        <div className="text-sm">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a health question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                      disabled={isChatting}
                    />
                    <Button onClick={handleSendChat} disabled={!chatInput.trim() || isChatting} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <strong>Disclaimer:</strong> AI analysis is for informational purposes only. Always consult your doctor for medical advice.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Medical Report</DialogTitle>
            <DialogDescription>
              Upload a PDF or image of your medical report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
            />

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  Selected: <strong>{selectedFile.name}</strong>
                </p>
                <p className="text-xs text-blue-600">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedFile(null);
                }}
                disabled={isExtracting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadAndExtract}
                disabled={!selectedFile || isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upload & Extract'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}