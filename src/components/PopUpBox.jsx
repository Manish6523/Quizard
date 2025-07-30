import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

export const PopUpBox = ({
  isOpen,
  onOpenChange,
  title,
  description,
  yes,
  no,
  setResValue,
}) => {
  const handleYes = () => {
    setResValue(true);
    onOpenChange(false);
  };

  const handleNo = () => {
    onOpenChange(false);
    setResValue(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleNo}>
            {no}
          </Button>
          <Button onClick={handleYes}>{yes}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
