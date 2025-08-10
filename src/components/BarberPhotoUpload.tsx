import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, User, Trash2 } from "lucide-react";

interface BarberPhotoUploadProps {
  barberId: string;
  barberName: string;
  currentPhotoPath?: string;
  onPhotoUpdate: (photoPath: string | null) => void;
}

export default function BarberPhotoUpload({ 
  barberId, 
  barberName, 
  currentPhotoPath, 
  onPhotoUpdate 
}: BarberPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Delete existing photo if it exists
      if (currentPhotoPath) {
        await supabase.storage
          .from('barber-photos')
          .remove([currentPhotoPath]);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${barberId}-${Date.now()}.${fileExt}`;

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('barber-photos')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Update barber record with new photo path
      const { error: updateError } = await (supabase as any)
        .from('barbers')
        .update({ photo_path: fileName })
        .eq('id', barberId);

      if (updateError) {
        throw updateError;
      }

      onPhotoUpdate(fileName);
      toast({
        title: "Photo Updated",
        description: "Barber photo has been successfully updated.",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!currentPhotoPath) return;

    setIsDeleting(true);

    try {
      // Delete photo from storage
      const { error: deleteError } = await supabase.storage
        .from('barber-photos')
        .remove([currentPhotoPath]);

      if (deleteError) {
        throw deleteError;
      }

      // Update barber record to remove photo path
      const { error: updateError } = await (supabase as any)
        .from('barbers')
        .update({ photo_path: null })
        .eq('id', barberId);

      if (updateError) {
        throw updateError;
      }

      onPhotoUpdate(null);
      toast({
        title: "Photo Deleted",
        description: "Barber photo has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getPhotoUrl = () => {
    if (!currentPhotoPath) return null;
    return supabase.storage.from('barber-photos').getPublicUrl(currentPhotoPath).data.publicUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {barberName} Photo
        </CardTitle>
        <CardDescription>
          Upload or update the barber's profile photo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Photo Display */}
        <div className="flex items-center justify-center">
          {currentPhotoPath ? (
            <div className="relative">
              <img
                src={getPhotoUrl()!}
                alt={barberName}
                className="h-32 w-32 rounded-full object-cover border-4 border-border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={handleDeletePhoto}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex justify-center">
          <label htmlFor={`photo-upload-${barberId}`}>
            <Button
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : currentPhotoPath ? "Change Photo" : "Upload Photo"}
              </span>
            </Button>
          </label>
          <input
            id={`photo-upload-${barberId}`}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Supported formats: JPG, PNG, GIF. Max size: 5MB
        </p>
      </CardContent>
    </Card>
  );
}