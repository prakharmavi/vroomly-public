import { BookingStatus } from "@/firebase/db/model/bookingmodel";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  CheckCheck
} from "lucide-react";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  switch (status) {
    case BookingStatus.PENDING:
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex gap-1 items-center">
          <Clock size={12} />
          <span>Pending</span>
        </Badge>
      );
    case BookingStatus.APPROVED:
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
          <CheckCircle size={12} />
          <span>Approved</span>
        </Badge>
      );
    case BookingStatus.REJECTED:
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex gap-1 items-center">
          <XCircle size={12} />
          <span>Rejected</span>
        </Badge>
      );
    case BookingStatus.CANCELED:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex gap-1 items-center">
          <AlertTriangle size={12} />
          <span>Canceled</span>
        </Badge>
      );
    case BookingStatus.COMPLETED:
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1 items-center">
          <CheckCheck size={12} />
          <span>Completed</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      );
  }
}
