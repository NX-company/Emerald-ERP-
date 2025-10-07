import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import type { DealDocument } from "@shared/schema";

interface AllDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DealDocument[];
  isLoading: boolean;
}

const documentTypeLabels = {
  quote: "КП",
  invoice: "Счёт",
  contract: "Договор",
  other: "Прочее"
};

export function AllDocumentsDialog({ open, onOpenChange, documents, isLoading }: AllDocumentsDialogProps) {
  const handleDownload = (doc: DealDocument) => {
    // In a real implementation, this would download the actual file
    // For now, we'll create a JSON export of the document data
    const dataStr = JSON.stringify(doc, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sortedDocuments = [...(documents ?? [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-all-documents">
        <DialogHeader>
          <DialogTitle>Все документы</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="status-documents-loading">
            Загрузка...
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="status-documents-empty">
            Документы отсутствуют
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                data-testid={`document-item-${doc.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <h4 className="font-medium truncate" data-testid={`document-name-${doc.id}`}>
                      {doc.name}
                    </h4>
                    {doc.is_signed && (
                      <Badge variant="default" className="text-xs">Подписан</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {documentTypeLabels[doc.document_type]}
                    </Badge>
                    {doc.version && (
                      <span className="text-xs">Версия {doc.version}</span>
                    )}
                    {doc.total_amount && (
                      <span className="text-xs">
                        • {parseFloat(doc.total_amount).toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(doc.created_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="ml-4"
                  data-testid={`button-download-document-${doc.id}`}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Скачать
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
