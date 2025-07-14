
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

interface MeetingCardProps {
  id: string;
  title: string;
  date: Date;
  duration: number; // in minutes
  participants: Participant[];
  languages: string[];
}

const MeetingCard = ({
  id,
  title,
  date,
  duration,
  participants,
  languages,
}: MeetingCardProps) => {
  const timeAgo = formatDistance(date, new Date(), { addSuffix: true });
  const maxParticipantsToShow = 3;

  return (
    <Card className="card-hover border-gray-200">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-roboto font-bold text-lg">{title}</h3>
          <div className="text-sm text-muted-foreground">{timeAgo}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {participants.slice(0, maxParticipantsToShow).map((participant) => (
              <Avatar key={participant.id} className="border-2 border-white h-8 w-8">
                <AvatarImage src={participant.avatar} alt={participant.name} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {participant.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {participants.length > maxParticipantsToShow && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-white">
                +{participants.length - maxParticipantsToShow}
              </div>
            )}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{duration} min</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {languages.map((lang) => (
            <span
              key={lang}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
            >
              {lang}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild className="w-full" variant="outline">
          <Link to={`/summary/${id}`}>View Summary</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MeetingCard;
