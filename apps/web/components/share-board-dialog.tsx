"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus, Users } from "lucide-react";
import { useUserSearch } from "../hooks/use-auth";
import { useAddBoardMember, useRemoveBoardMember } from "../hooks/use-kanban";
import { Badge } from "@/components/ui/badge";

interface ShareBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: any; // BoardDetail object containing ownerId and members array
  currentUserId?: string;
}

export function ShareBoardDialog({ open, onOpenChange, board, currentUserId }: ShareBoardDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);

  const addMember = useAddBoardMember(board.id);
  const removeMember = useRemoveBoardMember(board.id);

  const isOwner = currentUserId === board.ownerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Share Board</DialogTitle>
          <DialogDescription className="sr-only">Manage board members</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add Member Search (Owner Only) */}
          {isOwner && (
            <div className="space-y-2 relative">
              <Input
                placeholder="Search user by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length >= 2 && searchResults && (
                <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto p-1 top-12">
                  {searchResults.map((user) => {
                    const isAlreadyMember = board.members?.some((m: any) => m.userId === user.id) || board.ownerId === user.id;
                    return (
                      <div key={user.id} className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-6 h-6 rounded-full" alt="avatar" />
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAlreadyMember ? "secondary" : "default"}
                          disabled={isAlreadyMember || addMember.isPending}
                          onClick={() => {
                            addMember.mutate({ userId: user.id }, { onSuccess: () => setSearchQuery("") });
                          }}
                        >
                          {isAlreadyMember ? "Added" : <><UserPlus className="h-3 w-3 mr-1" /> Add</>}
                        </Button>
                      </div>
                    );
                  })}
                  {searchResults.length === 0 && !isSearching && (
                    <p className="p-2 text-sm text-center text-muted-foreground">No users found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Board Members</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {/* Owner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">O</div>
                  <div>
                    <p className="text-sm font-medium">Board Owner</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                <Badge>Owner</Badge>
              </div>

              {/* Members */}
              {board.members?.map((member: any) => (
                <div key={member.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.displayName}`} className="w-8 h-8 rounded-full" alt="avatar" />
                    <div>
                      <p className="text-sm font-medium">{member.displayName} {member.userId === currentUserId ? "(You)" : ""}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {(isOwner || member.userId === currentUserId) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeMember.mutate(member.userId)}
                      disabled={removeMember.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
