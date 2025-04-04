import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase/auth/AuthContext';
import { deleteCarListing } from '@/firebase/db/services/deleteCarListing';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteCarDialogProps {
  carId: string;
  carTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteCarDialog({ 
  carId, 
  carTitle, 
  isOpen, 
  onOpenChange, 
  onDeleted 
}: DeleteCarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await deleteCarListing(carId, user);
      
      if (result.success) {
        onOpenChange(false);
        onDeleted();
      } else {
        setError(result.error || 'Failed to delete car');
      }
    } catch (err) {
      console.error('Error deleting car:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this car?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{carTitle}</strong> from your listings.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
