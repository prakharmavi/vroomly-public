import { useState } from "react";
import { useAuth } from "@/firebase/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";

interface UserReviewFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserReviewForm({  onSuccess, onCancel }: UserReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to submit a review");
      return;
    }
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    
    if (comment.trim().length < 10) {
      setError("Please provide a more detailed review (at least 10 characters)");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Here you would implement the API call to save the review
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Write a Review</h3>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Rating</label>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select a rating"}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm font-medium">Your Review</label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || rating === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
