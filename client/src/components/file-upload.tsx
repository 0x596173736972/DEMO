import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  maxSize = 10 * 1024 * 1024, // 10MB
  className 
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors?.[0]?.code === "file-too-large") {
        setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      } else if (rejection.errors?.[0]?.code === "file-invalid-type") {
        setError("Please select a valid image file.");
      } else {
        setError("Invalid file.");
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      onFileSelect(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize,
    multiple: false,
  });

  const clearFile = () => {
    setPreview(null);
    setError(null);
    onFileSelect(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border border-gray-200"
          />
          <Button
            onClick={clearFile}
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "upload-area cursor-pointer",
            isDragActive && "border-accent bg-accent/5",
            error && "border-destructive"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          
          {isDragActive ? (
            <p className="text-gray-600 mb-2">Drop your image here...</p>
          ) : (
            <p className="text-gray-600 mb-2">Tap to upload or drag & drop</p>
          )}
          
          <p className="text-sm text-gray-500">
            PNG, JPG, WebP up to {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
