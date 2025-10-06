import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, FolderOpen, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

export default function Documents() {
  const { toast } = useToast();

  const { data: documents = [], isLoading, error } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  if (error) {
    toast({
      title: "Ошибка загрузки",
      description: "Не удалось загрузить документы",
      variant: "destructive",
    });
  }

  const typeColors: Record<string, string> = {
    "КП": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "Договор": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Счет": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "КД": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "quote": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "contract": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "invoice": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "drawing": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "other": "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const docsByType = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueProjects = new Set(documents.filter(d => d.project_id).map(d => d.project_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Документы</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Управление документами и Google Drive</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="icon"
            className="md:hidden"
            data-testid="button-open-drive"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="hidden md:flex"
            data-testid="button-open-drive-desktop"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Открыть в Drive
          </Button>
          <Button 
            size="icon"
            className="md:hidden"
            data-testid="button-upload-document"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button 
            className="hidden md:flex"
            data-testid="button-upload-document-desktop"
          >
            <Upload className="h-4 w-4 mr-2" />
            Загрузить
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" data-testid={`skeleton-stat-${i}`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate active-elevate-2 cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Всего документов</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold">{uniqueProjects.size}</p>
                <p className="text-sm text-muted-foreground">Проектов</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold">{docsByType["contract"] || 0}</p>
                <p className="text-sm text-muted-foreground">Договоров</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold">{docsByType["drawing"] || 0}</p>
                <p className="text-sm text-muted-foreground">КД</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Недавние документы</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : documents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Нет документов</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-md border hover-elevate active-elevate-2 cursor-pointer"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${typeColors[doc.type] || typeColors["other"]}`}>
                          {doc.type}
                        </Badge>
                        {doc.project_id && (
                          <Badge variant="outline" className="text-xs font-mono">#{doc.project_id.slice(0, 8)}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                        {doc.size && (
                          <span className="text-xs text-muted-foreground">{formatFileSize(typeof doc.size === 'string' ? parseInt(doc.size) : doc.size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
