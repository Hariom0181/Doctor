import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Loader2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { aiApiService } from '@/services/aiApi';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

export function MedicalReportAnalyzer() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!reportData.trim()) {
      toast({
        title: "Input Required",
        description: "Please paste your medical report data",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis('');

    try {
      const result = await aiApiService.analyzeReport(reportData);
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

  const sampleReport = `Hemoglobin: 11.2 g/dL (Low)
Blood Sugar (Fasting): 105 mg/dL
Cholesterol Total: 220 mg/dL (High)
HDL: 35 mg/dL (Low)
LDL: 145 mg/dL (High)
Triglycerides: 180 mg/dL
Blood Pressure: 145/95 mmHg (High)`;

  const loadSample = () => {
    setReportData(sampleReport);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Medical Report Analyzer
            </CardTitle>
            <CardDescription>
              Paste your lab results and get AI-powered insights
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadSample}>
            Load Sample
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Section */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Paste Your Lab Report Data
          </label>
          <Textarea
            placeholder="Example:
Hemoglobin: 12.5 g/dL
Blood Sugar: 95 mg/dL
Cholesterol: 180 mg/dL
Blood Pressure: 120/80 mmHg
..."
            value={reportData}
            onChange={(e) => setReportData(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Paste your lab results, vital signs, or any medical values you want analyzed
          </p>
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
            <div className="flex items-center gap-2 pb-2 border-b">
              <Badge className="bg-green-600">AI Analysis Results</Badge>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown
                    components={{
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-blue-900 mt-4 mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-gray-900 font-semibold" {...props} />
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Action Badges */}
            <div className="flex flex-wrap gap-2 pt-4">
              <Badge variant="outline" className="border-red-500 text-red-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                High Values Identified
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                Low Values Identified
              </Badge>
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Recommendations Provided
              </Badge>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Always consult with your doctor for accurate diagnosis and treatment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}