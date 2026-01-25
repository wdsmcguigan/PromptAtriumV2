import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  PanelLeftClose, 
  PanelLeft,
  FolderPlus,
  Lock,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Collection, Prompt, User } from "@shared/schema";

interface CollectionsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreateCollection?: () => void;
}

interface CollectionWithPrompts extends Collection {
  promptCount?: number;
}

export function CollectionsSidebar({ isOpen, onToggle, onCreateCollection }: CollectionsSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const typedUser = user as User | null;
  const [location, setLocation] = useLocation();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const { data: collections = [], isLoading: collectionsLoading } = useQuery<CollectionWithPrompts[]>({
    queryKey: ["/api/collections"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleCollectionClick = (collectionId: string) => {
    setLocation(`/collection/${collectionId}`);
  };

  const handlePromptClick = (promptId: string) => {
    setSelectedPromptId(promptId);
    setLocation(`/prompt/${promptId}`);
  };

  // Punctuation marks for visual interest
  const punctuationMarks = ["[ ]", "{x}", "~/", ".db", "_fn", ">>"];
  
  const getPunctuation = (index: number) => {
    return punctuationMarks[index % punctuationMarks.length];
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 ease-in-out flex flex-col",
          "bg-[#1c1c1c] border-r border-black/30",
          "shadow-[inset_1px_1px_2px_rgba(255,255,255,0.03),inset_-1px_-1px_2px_rgba(0,0,0,0.6)]",
          isOpen ? "w-64" : "w-0"
        )}
        data-testid="collections-sidebar"
        role="navigation"
        aria-label="Collections sidebar"
      >
        {isOpen && (
          <>
            {/* Header with logo */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#444] text-lg">::</span>
                  <span className="font-extrabold text-white tracking-tight text-lg">PROMPTA</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#a0a0a0] hover:text-white hover:bg-white/5"
                  onClick={onToggle}
                  data-testid="button-close-sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              {/* Core Modules Section */}
              <div className="mb-6">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#444] block mb-4 px-2">
                  Core_Modules
                </span>

                {/* Quick Actions */}
                <NavItem 
                  label="All Prompts"
                  mark="*"
                  active={location === '/library'}
                  onClick={() => setLocation('/library')}
                />
                <NavItem 
                  label="Community"
                  mark="{c}"
                  active={location === '/community'}
                  onClick={() => setLocation('/community')}
                />
                <NavItem 
                  label="Tools"
                  mark="_fn"
                  active={location === '/tools'}
                  onClick={() => setLocation('/tools')}
                />
                {onCreateCollection && (
                  <NavItem 
                    label="New Collection"
                    mark="+"
                    onClick={onCreateCollection}
                  />
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.02] shadow-[0_1px_0_rgba(0,0,0,0.5)] mx-2 mb-6" />

              {/* Collections Section */}
              <div>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#444] block mb-4 px-2">
                  Collections
                </span>

                {collectionsLoading ? (
                  <div className="space-y-2 px-2">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className="h-10 bg-[#252525] rounded animate-pulse shadow-[inset_1px_1px_2px_#000]" 
                      />
                    ))}
                  </div>
                ) : collections.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <div className="w-8 h-8 mx-auto mb-3 rounded bg-[#252525] shadow-[inset_1px_1px_3px_#000] flex items-center justify-center">
                      <span className="font-mono text-[#444] text-sm">?</span>
                    </div>
                    <p className="text-xs text-[#444] font-mono">No collections</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {collections.map((collection, idx) => (
                      <CollectionFolder
                        key={collection.id}
                        collection={collection}
                        isExpanded={expandedCollections.has(collection.id)}
                        onToggle={() => toggleCollection(collection.id)}
                        onClick={() => handleCollectionClick(collection.id)}
                        onPromptClick={handlePromptClick}
                        selectedPromptId={selectedPromptId}
                        punctuation={getPunctuation(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer / User Profile */}
            <div className="border-t border-white/[0.03] p-4 mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#333] rounded-sm shadow-[inset_1px_1px_3px_#000] flex items-center justify-center overflow-hidden">
                  {typedUser?.profileImageUrl ? (
                    <img 
                      src={typedUser.profileImageUrl} 
                      alt={typedUser.username || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-mono text-[#444] text-sm">
                      {typedUser?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#ddd]">
                    {typedUser?.username || 'User'}
                  </span>
                  <span className="font-mono text-[0.65rem] text-[#444]">
                    active_session
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-3 top-[4.5rem] z-30 h-8 w-8 bg-[#1c1c1c] border border-black/30 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.03)] hover:bg-[#252525] text-[#a0a0a0]"
          onClick={onToggle}
          data-testid="button-open-sidebar"
          aria-label="Open collections sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}

// Nav Item Component
interface NavItemProps {
  label: string;
  mark: string;
  active?: boolean;
  count?: number;
  onClick: () => void;
}

function NavItem({ label, mark, active, count, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 mb-2 rounded-sm transition-all duration-300",
        "text-[#a0a0a0] hover:text-white hover:translate-x-1",
        "relative group",
        active && [
          "text-white bg-white/[0.02]",
          "shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.03)]"
        ]
      )}
    >
      {/* Relief effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-sm opacity-0 transition-opacity duration-300",
        "shadow-[inset_1px_1px_2px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.03)]",
        "group-hover:opacity-100"
      )} />
      
      <span className="font-light text-[1.05rem] z-10">{label}</span>
      
      {count !== undefined ? (
        <span className="font-mono text-[0.7rem] bg-[#252525] px-1.5 py-0.5 rounded-sm text-[#444] shadow-[inset_1px_1px_2px_#000] z-10">
          {count}
        </span>
      ) : (
        <span className={cn(
          "font-mono text-[0.9rem] text-[#444] transition-colors duration-300 z-10",
          active && "text-white"
        )}>
          {mark}
        </span>
      )}
    </button>
  );
}

// Collection Folder Component
interface CollectionFolderProps {
  collection: CollectionWithPrompts;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onPromptClick: (promptId: string) => void;
  selectedPromptId: string | null;
  punctuation: string;
}

function CollectionFolder({ 
  collection, 
  isExpanded, 
  onToggle, 
  onClick,
  onPromptClick,
  selectedPromptId,
  punctuation
}: CollectionFolderProps) {
  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/collections", collection.id, "prompts"],
    queryFn: async () => {
      const res = await fetch(`/api/collections/${collection.id}/prompts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch prompts");
      return res.json();
    },
    enabled: isExpanded,
    staleTime: 2 * 60 * 1000,
  });

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-300 group",
          "text-[#a0a0a0] hover:text-white",
          isExpanded && "text-white bg-white/[0.02] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.03)]"
        )}
        data-testid={`folder-collection-${collection.id}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CollapsibleTrigger asChild>
            <button
              className="p-0.5 hover:bg-white/10 rounded focus:outline-none"
              aria-label={isExpanded ? "Collapse collection" : "Expand collection"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-[#444]" />
              ) : (
                <ChevronRight className="h-3 w-3 text-[#444]" />
              )}
            </button>
          </CollapsibleTrigger>
          
          <button 
            className="flex-1 text-left font-light text-sm truncate hover:underline focus:outline-none"
            onClick={onClick}
            onKeyDown={(e) => handleKeyDown(e, onClick)}
            tabIndex={0}
          >
            {collection.name}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {collection.isPublic ? (
            <Globe className="h-3 w-3 text-[#444]" />
          ) : (
            <Lock className="h-3 w-3 text-[#444]" />
          )}
          <span className="font-mono text-[0.7rem] bg-[#252525] px-1.5 py-0.5 rounded-sm text-[#444] shadow-[inset_1px_1px_2px_#000]">
            {collection.promptCount || 0}
          </span>
        </div>
      </div>
      
      <CollapsibleContent>
        <div className="ml-6 pl-3 border-l border-[#333] space-y-0.5 py-2">
          {isLoading ? (
            <div className="space-y-1 py-1">
              {[1, 2].map((i) => (
                <div key={i} className="h-6 bg-[#252525] rounded animate-pulse shadow-[inset_1px_1px_2px_#000]" />
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <p className="text-xs text-[#444] font-mono py-1 px-2 italic">
              // empty
            </p>
          ) : (
            prompts.slice(0, 10).map((prompt) => (
              <button
                key={prompt.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-sm transition-all duration-200 w-full text-left",
                  "text-[#666] hover:text-[#a0a0a0] hover:bg-white/[0.02]",
                  selectedPromptId === prompt.id && "text-white bg-white/[0.02] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]"
                )}
                onClick={() => onPromptClick(prompt.id)}
                onKeyDown={(e) => handleKeyDown(e, () => onPromptClick(prompt.id))}
                data-testid={`file-prompt-${prompt.id}`}
              >
                <span className="font-mono text-[#444] text-xs">~</span>
                <span className="text-xs truncate">
                  {prompt.name}
                </span>
              </button>
            ))
          )}
          {prompts.length > 10 && (
            <button 
              className="text-xs text-[#666] hover:text-[#a0a0a0] font-mono px-3 py-1 w-full text-left focus:outline-none hover:underline"
              onClick={onClick}
              onKeyDown={(e) => handleKeyDown(e, onClick)}
            >
              +{prompts.length - 10} more...
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
