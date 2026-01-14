import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Sparkles, Loader2, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { aiApiService, type RiskScoreData } from '@/services/aiApi';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface PatientAIAnalysisProps {
  patientId: number;
  patientName: string;
}

export function PatientAIAnalysis({ patientId, patientName }: PatientAIAnalysisProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskScore, setRiskScore] = useState<RiskScoreData | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);

  const handleCalculateRisk = async () => {
    setIsAnalyzing(true);
    try {
      const result = await aiApiService.calculateAndSaveRiskScore(patientId);
      setRiskScore(result);
      setShowRiskDialog(true);
      
      toast({
        title: "Risk Score Calculated",
        description: `Patient classified as ${result.riskLevel} risk`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate risk score",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateInsights = async () => {
    setIsAnalyzing(true);
    try {
      const result = await aiApiService.generateAndSaveMedicalInsights(patientId);
      setInsights(result);
      setShowInsightsDialog(true);
      
      toast({
        title: "Insights Generated",
        description: "Medical insights have been generated"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Normal': return 'bg-green-600';
      case 'Moderate': return 'bg-yellow-600';
      case 'Critical': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analysis
          </CardTitle>
          <CardDescription>
            Generate AI-powered insights for {patientName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleCalculateRisk}
            disabled={isAnalyzing}
            className="w-full"
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Calculate Risk Score
              </>
            )}
          </Button>

          <Button
            onClick={handleGenerateInsights}
            disabled={isAnalyzing}
            className="w-full"
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Medical Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Risk Score Dialog */}
      <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="shrink-0">
            <DialogTitle>AI Risk Assessment</DialogTitle>
            <DialogDescription>
              Calculated for {patientName}
            </DialogDescription>
          </DialogHeader>

          {riskScore && (
            <div className="space-y-4">
              {/* Risk Score Display */}
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border shrink-0">
                <div className="text-6xl font-bold mb-2">{riskScore.riskScore}</div>
                <Badge className={`${getRiskColor(riskScore.riskLevel)} text-white text-lg px-4 py-1`}>
                  {riskScore.riskLevel} Risk
                </Badge>
              </div>

              {/* Key Factors */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Key Risk Factors
                </h4>
                <ul className="grid gap-2">
                  {riskScore.keyFactors.map((factor, idx) => (
                    <li key={idx} className="text-sm bg-yellow-50 border border-yellow-200 rounded-md  px-3 py-2">
                      • {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 sticky top-0 bg-white py-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  AI Recommendations
                </h4>
                <ul className="grid gap-2">
                  {riskScore.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Insights Dialog */}
      <Dialog open={showInsightsDialog} onOpenChange={setShowInsightsDialog}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="shrink-0">
            <DialogTitle>Medical Insights</DialogTitle>
            <DialogDescription>
              AI-generated analysis for {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 mt-4 custom-scrollbar">
            <div className="prose prose-sm md:prose-base max-w-none pb-6">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}