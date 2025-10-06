import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, FolderOpen, Upload } from "lucide-react";

export default function Documents() {
  // todo: remove mock functionality
  const documents = [
    {
      id: "DOC001",
      name: "КП_567_Кухонный_гарнитур.pdf",
      type: "КП",
      project: "567",
      date: "05.11.2025",
      size: "245 KB",
    },
    {
      id: "DOC002",
      name: "Договор_567_ООО_Интерьер_Плюс.pdf",
      type: "Договор",
      project: "567",
      date: "06.11.2025",
      size: "512 KB",
    },
    {
      id: "DOC003",
      name: "Счет_567_001.pdf",
      type: "Счет",
      project: "567",
      date: "06.11.2025",
      size: "180 KB",
    },
    {
      id: "DOC004",
      name: "Чертеж_КД_567_фасады.dwg",
      type: "КД",
      project: "567",
      date: "08.11.2025",
      size: "1.2 MB",
    },
  ];

  const typeColors: Record<string, string> = {
    "КП": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "Договор": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Счет": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "КД": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Документы</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление документами и Google Drive</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-open-drive">
            <ExternalLink className="h-4 w-4 mr-2" />
            Открыть в Drive
          </Button>
          <Button data-testid="button-upload-document">
            <Upload className="h-4 w-4 mr-2" />
            Загрузить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate active-elevate-2 cursor-pointer">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">24</p>
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
              <p className="text-2xl font-bold">8</p>
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
              <p className="text-2xl font-bold">12</p>
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
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-muted-foreground">КД</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Недавние документы</CardTitle>
        </CardHeader>
        <CardContent>
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
                      <Badge variant="outline" className={`text-xs ${typeColors[doc.type]}`}>
                        {doc.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">#{doc.project}</Badge>
                      <span className="text-xs text-muted-foreground">{doc.date}</span>
                      <span className="text-xs text-muted-foreground">{doc.size}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
