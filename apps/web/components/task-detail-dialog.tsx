"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Trash2, Flag, Tag, UserCircle, MessageSquare, Paperclip, UploadCloud } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserSearch } from "../hooks/use-auth";
import { useComments, useAddComment, useUploadAttachment } from "../hooks/use-kanban";
import type { components } from "@repo/api-types";

type TaskItem = components["schemas"]["TaskItem"];

interface TaskDetailDialogProps {
  task: TaskItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title?: string;
    description?: string;
    priority?: string;
    tags?: string[];
    dueDate?: string;
    assigneeId?: string;
  }) => void;
  onDelete: () => void;
  saving?: boolean;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  saving = false,
}: TaskDetailDialogProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "files">("details");

  // Details State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tagsStr, setTagsStr] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Comments & Upload State
  const [newComment, setNewComment] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Data Hooks
  const { data: searchResults } = useUserSearch(searchQuery);
  const { data: comments, isLoading: loadingComments } = useComments(task?.columnId || "", task?.id || "");
  const addComment = useAddComment(task?.columnId || "", task?.id || "");
  const uploadAttachment = useUploadAttachment(task?.columnId || "", task?.id || "");

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority?.toLowerCase() ?? "medium");
      setTagsStr(task.tags?.join(", ") ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
      setAssigneeId(task.assigneeId ?? null);

      // Reset temporary states
      setSearchQuery("");
      setNewComment("");
      setUploadFile(null);
      setHasChanges(false);
      setActiveTab("details");
    }
  }, [task, open]);

  const handleSave = () => {
    if (!task) return;
    const updates: Parameters<typeof onSave>[0] = {};

    if (title !== task.title) updates.title = title;
    if (description !== (task.description ?? "")) updates.description = description;
    if (priority !== task.priority) updates.priority = priority;

    if (assigneeId !== (task.assigneeId ?? null)) {
      updates.assigneeId = assigneeId || "";
    }

    const newTags = tagsStr.split(",").map(t => t.trim()).filter(Boolean);
    const oldTags = task.tags || [];
    if (JSON.stringify(newTags) !== JSON.stringify(oldTags)) {
      updates.tags = newTags;
    }

    const newDueDate = dueDate ? new Date(dueDate).toISOString() : undefined;
    if (newDueDate !== task.dueDate) {
      updates.dueDate = newDueDate;
    }

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    setHasChanges(false);
  };

  const handlePostComment = () => {
    if (!newComment.trim() || !task) return;
    addComment.mutate(newComment.trim(), {
      onSuccess: () => setNewComment("")
    });
  };

  const handleFileUpload = () => {
    if (!uploadFile || !task) return;
    uploadAttachment.mutate(uploadFile, {
      onSuccess: () => setUploadFile(null)
    });
  };

  if (!task) return null;

  // ─── TABS RENDERING ─────────────────────────────────────────────────────────────

  const renderDetailsTab = () => (
    <div className="space-y-4 pt-4">
      {/* Changed to Textarea for multiline support */}
      <div className="space-y-2">
        <Label htmlFor="task-title">Title / Main Note</Label>
        <Textarea
          id="task-title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
          placeholder="Enter task note..."
          rows={3}
          className="text-base font-medium resize-none min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
          placeholder="Add a description..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-assignee" className="flex items-center gap-1.5">
          <UserCircle className="h-3.5 w-3.5" /> Assignee
        </Label>
        <div className="relative">
          <Input
            id="task-assignee"
            placeholder="Search user by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto p-1">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setAssigneeId(user.id);
                    setSearchQuery("");
                    setHasChanges(true);
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent flex items-center gap-2 transition-colors"
                >
                  <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-5 h-5 rounded-full object-cover" alt="avatar" />
                  <span className="font-medium">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{user.email}</span>
                </button>
              ))}
            </div>
          )}
          {assigneeId && (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
              <span className="text-sm font-medium">Assigned ID: <span className="font-mono">{assigneeId.slice(0,8)}...</span></span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto hover:bg-destructive/20 hover:text-destructive" onClick={() => { setAssigneeId(null); setHasChanges(true); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-priority" className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" /> Priority</Label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setHasChanges(true); }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-dueDate" className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Due Date</Label>
          <Input id="task-dueDate" type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setHasChanges(true); }} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-tags" className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags</Label>
        <Input id="task-tags" value={tagsStr} onChange={(e) => { setTagsStr(e.target.value); setHasChanges(true); }} placeholder="frontend, bug, priority (comma separated)" />
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Created {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={saving}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Task</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving || !title.trim()}>{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </div>
    </div>
  );

  const renderCommentsTab = () => (
    <div className="space-y-4 pt-4 flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {loadingComments ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Start the conversation!</p>
        ) : (
          comments?.map((c) => (
            <div key={c.id} className="bg-muted/50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <img src={c.userAvatarUrl || `https://ui-avatars.com/api/?name=${c.userDisplayName}`} className="w-5 h-5 rounded-full object-cover" alt="avatar" />
                <span className="text-sm font-semibold">{c.userDisplayName}</span>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
      <div className="pt-2 border-t flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
        />
        <Button onClick={handlePostComment} disabled={!newComment.trim() || addComment.isPending}>
          {addComment.isPending ? "..." : "Post"}
        </Button>
      </div>
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4 pt-4 h-[400px]">
      <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <UploadCloud className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Upload an attachment</p>
          <p className="text-xs text-muted-foreground mb-4">Max file size 10MB.</p>
        </div>
        <div className="flex items-center gap-2 w-full max-w-xs">
          <Input
            type="file"
            className="text-xs flex-1 cursor-pointer"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          />
        </div>
        <Button
          size="sm"
          className="w-full max-w-xs mt-2"
          onClick={handleFileUpload}
          disabled={!uploadFile || uploadAttachment.isPending}
        >
          {uploadAttachment.isPending ? "Uploading..." : "Upload File"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Attachments will appear on the task card icon.
        <br/>(Full file browser coming soon!)
      </p>
    </div>
  );

  // ─── WRAPPER ────────────────────────────────────────────────────────────────────

  const innerContent = (
    <div className="flex flex-col h-full min-h-[450px]">
      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border w-full">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-2.5 text-sm font-medium transition-colors relative ${activeTab === "details" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Details
          {activeTab === "details" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === "comments" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Comments
          {activeTab === "comments" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`pb-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === "files" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Paperclip className="h-3.5 w-3.5" /> Files
          {activeTab === "files" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {/* Tab Body */}
      {activeTab === "details" && renderDetailsTab()}
      {activeTab === "comments" && renderCommentsTab()}
      {activeTab === "files" && renderFilesTab()}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xl">Edit Task</DrawerTitle>
            <DrawerDescription className="sr-only">Edit the details of the task</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">{innerContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold">Edit Task</DialogTitle>
          <DialogDescription className="sr-only">Edit the details of the task</DialogDescription>
        </DialogHeader>
        {innerContent}
      </DialogContent>
    </Dialog>
  );
}
