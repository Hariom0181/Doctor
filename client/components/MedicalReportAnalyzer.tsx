import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Sparkles, Loader2, Upload, MessageSquare, Send, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { aiApiService } from '@/services/aiApi';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface MedicalReportAnalyzerProps {
  patientId: number;
}

export function MedicalReportAnalyzer({ patientId }: MedicalReportAnalyzerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('analyze');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatting]);

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
    if (!selectedFile) return;

    setIsExtracting(true);
    setReportData('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      const uploadResponse = await fetch('http://localhost:5000/api/documents/extract-only', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('patientToken')}`
        },
        body: formData
      });

      const result = await uploadResponse.json();

      if (!uploadResponse.ok || !result.success) {
        throw new Error(result.message || "Extraction failed");
      }

      setReportData(result.extractedText || "No text could be extracted.");

      toast({
        title: "Success",
        description: "Report text extracted successfully."
      });

      setIsUploadDialogOpen(false);
      setSelectedFile(null);

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Could not process the file.",
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
    if (!reportData || !reportData.trim()) {
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

  // Copy Analysis to Clipboard
  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(analysis);
    setCopiedAnalysis(true);
    toast({
      title: "Copied",
      description: "Analysis copied to clipboard"
    });
    setTimeout(() => setCopiedAnalysis(false), 2000);
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
    <div className="w-full h-full flex flex-col bg-white overflow-hidden flex-1">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-400 flex items-center justify-center shadow-md shadow-amber-400/30">
            <Sparkles className="w-5 h-5 text-slate-900 fill-slate-900" />
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold tracking-tight">Health AI Assistant</h3>
            <p className="text-slate-400 text-xs mt-1">Medical report analysis & health chat</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-slate-200">
              <TabsTrigger
                value="analyze"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-amber-400 rounded-none pb-3 text-slate-600 data-[state=active]:text-slate-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                Report Analysis
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-amber-400 rounded-none pb-3 text-slate-600 data-[state=active]:text-slate-900"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Health Chat
              </TabsTrigger>
            </TabsList>
          </div>

          {/* REPORT ANALYSIS TAB */}
          <TabsContent value="analyze" className="flex-1 overflow-hidden flex flex-col p-6">
            <ScrollArea className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-5 pt-0 pb-6">
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="w-full h-10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Report
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setReportData(sampleReport)}
                    className="w-full h-10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Load Sample
                  </Button>
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Response Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-full bg-white border-slate-200">
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
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Your Medical Report</label>
                  <Textarea
                    placeholder="Paste your lab report, medical records, or upload a file..."
                    value={reportData}
                    onChange={(e) => setReportData(e.target.value)}
                    rows={8}
                    className="font-mono text-sm border-slate-200 focus:border-amber-400 focus:ring-amber-400/10"
                  />
                  <p className="text-xs text-slate-500">{reportData.length} characters</p>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!reportData.trim() || isAnalyzing}
                  className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold"
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
                  <div className="space-y-3 animate-in fade-in-50 duration-500">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-600 hover:bg-green-700">Analysis Results</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyAnalysis}
                        className="h-8 px-3 text-xs hover:bg-slate-100"
                      >
                        {copiedAnalysis ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 rounded-xl p-6 border border-blue-200/50 shadow-sm">
                      <div className="text-slate-800 leading-relaxed space-y-3">
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-base font-bold text-slate-900 mt-3 mb-2" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-slate-900 mt-2 mb-1" {...props} />,
                            p: ({ node, ...props }) => <p className="text-sm text-slate-800 mb-2 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 text-sm text-slate-800" {...props} />,
                            li: ({ node, ...props }) => <li className="text-sm text-slate-800" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                          }}
                        >
                          {analysis}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* CHAT TAB */}
          <TabsContent
            value="chat"
            className="flex-1 flex flex-col p-0 m-0 mt-0 min-h-0"
          >
            <div className="flex-1 flex flex-col bg-white min-h-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 w-full overflow-y-auto">                <div className="px-5 pt-3 pb-5 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-xl px-4 py-3 ${msg.role === 'user'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-900 border border-slate-200'
                      }`}>
                      <div className="text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <p className="text-sm m-0" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-amber-400" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
              </ScrollArea>

              {/* Input Section */}
              <div className="border-t border-slate-200 bg-white p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a health question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                    disabled={isChatting}
                    className="flex-1 border-slate-200 focus:border-slate-300 focus:ring-0 focus:ring-offset-0"
                  />
                  <Button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || isChatting}
                    size="icon"
                    className="h-10 w-10 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-slate-200 bg-amber-50 px-6 py-4 flex-shrink-0">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Important:</strong> AI analysis is for informational purposes only. Always consult your healthcare provider for medical advice and diagnosis.
          </p>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Upload Medical Report
            </DialogTitle>
            <DialogDescription>
              Upload a PDF or image of your medical report for AI analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-xs text-green-700 mt-1">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
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
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold"
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
    </div>
  );
}