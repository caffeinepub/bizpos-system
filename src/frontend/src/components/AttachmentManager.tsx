import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  data: string; // base64
  uploadedAt: string;
}

interface AttachmentManagerProps {
  moduleKey: string;
  recordId: string;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf") return File;
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "text/csv"
  )
    return FileSpreadsheet;
  if (type === "text/plain") return FileText;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentManager({
  moduleKey,
  recordId,
}: AttachmentManagerProps) {
  const storageKey = `bizpos_attachments_${moduleKey}_${recordId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState("");

  const getAttachments = (): Attachment[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  };

  const [attachments, setAttachmentsState] =
    useState<Attachment[]>(getAttachments);

  const saveAttachments = (list: Attachment[]) => {
    localStorage.setItem(storageKey, JSON.stringify(list));
    setAttachmentsState(list);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const MAX_SIZE = 5 * 1024 * 1024;
    const current = getAttachments();
    let added = 0;
    const promises = files.map(
      (file) =>
        new Promise<void>((resolve) => {
          if (file.size > MAX_SIZE) {
            toast.error(`${file.name} exceeds 5MB limit`);
            resolve();
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            current.push({
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              filename: file.name,
              size: file.size,
              type: file.type,
              data: reader.result as string,
              uploadedAt: new Date().toISOString(),
            });
            added++;
            resolve();
          };
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(promises).then(() => {
      saveAttachments([...current]);
      if (added > 0) toast.success(`${added} file(s) uploaded`);
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const handleDownload = (att: Attachment) => {
    const link = document.createElement("a");
    link.href = att.data;
    link.download = att.filename;
    link.click();
  };

  const handleDelete = (id: string) => {
    const updated = attachments.filter((a) => a.id !== id);
    saveAttachments(updated);
    toast.success("Attachment removed");
  };

  const handlePreview = (att: Attachment) => {
    if (att.type.startsWith("image/")) {
      setPreviewUrl(att.data);
      setPreviewFilename(att.filename);
    } else {
      handleDownload(att);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          data-ocid="attachments.upload_button"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
        <span className="text-xs text-muted-foreground">
          Max 5MB per file — Images, PDF, Excel, Word, Text
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* File List */}
      {attachments.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg text-muted-foreground"
          data-ocid="attachments.empty_state"
        >
          <Paperclip className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No attachments yet</p>
          <p className="text-xs mt-1">Upload files to attach them here</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {attachments.map((att, i) => {
            const Icon = getFileIcon(att.type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                data-ocid={`attachments.item.${i + 1}`}
              >
                <div className="flex-shrink-0">
                  {att.type.startsWith("image/") ? (
                    <button
                      type="button"
                      onClick={() => handlePreview(att)}
                      className="h-10 w-10 p-0 border-0 bg-transparent"
                    >
                      <img
                        src={att.data}
                        alt={att.filename}
                        className="h-10 w-10 rounded object-cover border"
                      />
                    </button>
                  ) : (
                    <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center border">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    className="text-sm font-medium truncate cursor-pointer hover:text-primary text-left w-full block"
                    onClick={() => handlePreview(att)}
                  >
                    {att.filename}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(att.size)} ·{" "}
                    {new Date(att.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(att)}
                    data-ocid={`attachments.secondary_button.${i + 1}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(att.id)}
                    data-ocid={`attachments.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <button
          type="button"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/70",
          )}
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[80vh] bg-white rounded-lg p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-center mb-2 text-muted-foreground">
              {previewFilename}
            </p>
            <img
              src={previewUrl}
              alt={previewFilename}
              className="max-h-[70vh] max-w-full rounded object-contain"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => setPreviewUrl(null)}
            >
              Close
            </Button>
          </div>
        </button>
      )}
    </div>
  );
}
