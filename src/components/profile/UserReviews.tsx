import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, Flag, User, Loader2 } from "lucide-react";
import { UserReviewForm } from "./UserReviewForm";
import { useAuth } from "@/firebase/auth/AuthContext";

interface Review {
  id: string;
  userId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any; // Timestamp
  helpfulCount: number;
}

interface UserReviewsProps {
  userId: string;
  userName: string;
}

export function UserReviews({ userId, userName }: UserReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    // Fetch reviews for the user
    async function fetchReviews() {
      try {
        setLoading(true);
        // Here you would implement the API call to fetch reviews
        // For now, we'll just simulate with an empty array
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReviews([]);
        setAverageRating(0);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [userId]);

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    // Reload reviews
    // For now, we'll just simulate with the current state
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (showReviewForm) {
    return (
      <UserReviewForm
        userId={userId}
        onSuccess={handleReviewSubmitted}
        onCancel={() => setShowReviewForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Reviews for {userName}</h2>
        {user && user.uid !== userId && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>
      
      {reviews.length > 0 ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {renderStars(averageRating)}
            </div>
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length} reviews)</span>
          </div>
          
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {review.reviewerPhoto ? (
                          <AvatarImage src={review.reviewerPhoto} alt={review.reviewerName} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{review.reviewerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <p className="text-sm mt-2 mb-4">{review.comment}</p>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      Helpful ({review.helpfulCount})
                    </button>
                    <button className="flex items-center gap-1 hover:text-foreground">
                      <Flag className="h-4 w-4" />
                      Report
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center p-8 bg-muted/20 rounded-lg border">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to leave a review for {userName}.</p>
          {user && user.uid !== userId && (
            <Button onClick={() => setShowReviewForm(true)} className="mt-4">
              Write a Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
