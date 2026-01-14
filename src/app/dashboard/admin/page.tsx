'use client';

/**
 * Admin Dashboard - Main playbook management page
 * Modern Shadcn UI with Oxford Blue + Gold theme
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Share2, 
  XCircle, 
  CheckCircle2, 
  HelpCircle, 
  PlusCircle, 
  Trash2, 
  Users, 
  Copy, 
  User,
  Loader2,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { useUser } from '@/components/UserContext';
import { PlaybookAPI } from '@/services/api';
import { Playbook, Role as PrismaRole, ShareRequestBody, ShareAdvancedResponse, ShareResultItem } from '@/types/api';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailInput {
  id: string;
  email: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  userId?: string;
  error?: string;
}

type ShareType = 'IMPLEMENTOR' | 'COLLABORATOR';

interface ImplementorPlaybook extends Playbook {
  sourcePlaybook?: { name: string } | null;
}

export default function Dashboard() {
  const router = useRouter();
  const user = useUser();

  const [myPlaybooks, setMyPlaybooks] = useState<Playbook[]>([]);
  const [collaborationPlaybooks, setCollaborationPlaybooks] = useState<Playbook[]>([]);
  const [implementorPlaybooks, setImplementorPlaybooks] = useState<ImplementorPlaybook[]>([]);

  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | undefined>(undefined);
  const [playbookName, setPlaybookName] = useState('');
  const [playbookDescription, setPlaybookDescription] = useState('');
  const [showCreatePlaybookModal, setShowCreatePlaybook] = useState(false);
  const [openPlaybookCard, setOpenPlaybookCard] = useState(false);

  const [loadingStates, setLoadingStates] = useState({ my: true, collaboration: true, implementor: true });
  const [errorStates, setErrorStates] = useState({ my: null as string | null, collaboration: null as string | null, implementor: null as string | null });

  const [showShareModal, setShowShareModal] = useState(false);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [emailsToShare, setEmailsToShare] = useState<EmailInput[]>([]);
  const [shareType, setShareType] = useState<ShareType>('COLLABORATOR');
  const [collaboratorRole, setCollaboratorRole] = useState<PrismaRole>(PrismaRole.COLLABORATOR);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareResults, setShareResults] = useState<ShareResultItem[]>([]);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchAllPlaybooks = async () => {
      setLoadingStates(prev => ({ ...prev, my: true }));
      try {
        const myData = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        setMyPlaybooks(myData || []);
        setErrorStates(prev => ({ ...prev, my: null }));
      } catch (error: any) {
        setErrorStates(prev => ({ ...prev, my: error.message || "Failed to load your playbooks." }));
      } finally {
        setLoadingStates(prev => ({ ...prev, my: false }));
      }

      setLoadingStates(prev => ({ ...prev, collaboration: true }));
      try {
        const collabData = await PlaybookAPI.getCollaborationPlaybooks();
        setCollaborationPlaybooks(collabData || []);
        setErrorStates(prev => ({ ...prev, collaboration: null }));
      } catch (error: any) {
        setErrorStates(prev => ({ ...prev, collaboration: error.message || "Failed to load collaboration playbooks." }));
      } finally {
        setLoadingStates(prev => ({ ...prev, collaboration: false }));
      }

      setLoadingStates(prev => ({ ...prev, implementor: true }));
      try {
        const implData = await PlaybookAPI.getImplementorPlaybooks();
        setImplementorPlaybooks(implData || []);
        setErrorStates(prev => ({ ...prev, implementor: null }));
      } catch (error: any) {
        setErrorStates(prev => ({ ...prev, implementor: error.message || "Failed to load implemented playbooks." }));
      } finally {
        setLoadingStates(prev => ({ ...prev, implementor: false }));
      }
    };
    fetchAllPlaybooks();
  }, [user]);

  const refreshAllPlaybookData = async () => {
    if (!user || !user.id) return;
    setLoadingStates({ my: true, collaboration: true, implementor: true });
    try {
      const myData = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
      setMyPlaybooks(myData || []);
      const collabData = await PlaybookAPI.getCollaborationPlaybooks();
      setCollaborationPlaybooks(collabData || []);
      const implData = await PlaybookAPI.getImplementorPlaybooks();
      setImplementorPlaybooks(implData || []);
      setErrorStates({ my: null, collaboration: null, implementor: null });
    } catch (error: any) {
      console.error("Error refreshing playbook data:", error);
      setErrorStates(prev => ({ ...prev, my: "Failed to refresh playbooks" }));
    } finally {
      setLoadingStates({ my: false, collaboration: false, implementor: false });
    }
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent mb-4" />
      <p className="text-muted-foreground">Loading user data...</p>
    </div>
  );

  const handleShowPlaybookModal = () => setShowCreatePlaybook(true);
  const handleClosePlaybookModal = () => {
    setShowCreatePlaybook(false);
    setPlaybookName('');
    setPlaybookDescription('');
    setErrorStates(prev => ({ ...prev, my: null }));
  };

  const handleCreatePlaybook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playbookName.trim() || !user?.id) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, my: true }));
    setErrorStates(prev => ({ ...prev, my: null }));
    try {
      const newPlaybook = await PlaybookAPI.create({
        name: playbookName,
        shortDescription: playbookDescription || undefined,
        ownerId: user.id,
      });
      setMyPlaybooks([newPlaybook, ...myPlaybooks]);
      handleClosePlaybookModal();
    } catch (error: any) {
      setErrorStates(prev => ({ ...prev, my: error.message || "Failed to create playbook." }));
    } finally {
      setLoadingStates(prev => ({ ...prev, my: false }));
    }
  };

  const handleOpenPlaybookCard = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setOpenPlaybookCard(true);
  };

  const handleOpenShareModal = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setShowShareModal(true);
    setShareError(null);
    setEmailsToShare([]);
    setEmailInputValue('');
    setShareType('COLLABORATOR');
    setCollaboratorRole(PrismaRole.COLLABORATOR);
    setShareResults([]);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setShareError(null);
    setEmailsToShare([]);
    setEmailInputValue('');
    setShareResults([]);
  };

  const handleAddEmail = async () => {
    if (!emailInputValue.trim() || !/^\S+@\S+\.\S+$/.test(emailInputValue.trim())) {
      setShareError("Please enter a valid email address.");
      return;
    }
    const newEmail = emailInputValue.trim().toLowerCase();
    if (emailsToShare.find(e => e.email === newEmail)) {
      setShareError("This email has already been added.");
      setEmailInputValue('');
      return;
    }

    const emailEntry: EmailInput = { id: crypto.randomUUID(), email: newEmail, status: 'checking' };
    setEmailsToShare(prev => [...prev, emailEntry]);
    setEmailInputValue('');
    setShareError(null);

    try {
      const userRes = await fetch(`/api/user?email=${newEmail}`);
      const userData = await userRes.json();

      if (!userRes.ok || !userData?.id) {
        setEmailsToShare(prev => prev.map(e => e.id === emailEntry.id ? { ...e, status: 'invalid', error: userData.error || "User not found." } : e));
      } else {
        setEmailsToShare(prev => prev.map(e => e.id === emailEntry.id ? { ...e, status: 'valid', userId: userData.id } : e));
      }
    } catch (err: any) {
      setEmailsToShare(prev => prev.map(e => e.id === emailEntry.id ? { ...e, status: 'invalid', error: "Error validating email." } : e));
    }
  };

  const handleRemoveEmail = (idToRemove: string) => {
    setEmailsToShare(prev => prev.filter(e => e.id !== idToRemove));
  };

  const handleSharePlaybook = async () => {
    if (!selectedPlaybook) {
      setShareError("No playbook selected for sharing.");
      return;
    }
    if (!user || !user.id) {
      setShareError("User not authenticated.");
      return;
    }
    const validShares = emailsToShare.filter(e => e.status === 'valid' && e.userId);
    if (validShares.length === 0) {
      setShareError("No valid users to share with.");
      return;
    }

    setSharing(true);
    setShareError(null);
    setShareResults([]);

    const sharesPayloadItems = validShares.map(e => ({
      email: e.email,
      targetUserId: e.userId!,
      shareType: shareType,
      collaboratorRole: shareType === 'COLLABORATOR' ? collaboratorRole : undefined,
    }));

    const finalPayload: ShareRequestBody = { 
      shares: sharesPayloadItems,
      sharedByUserId: user.id
    };

    try {
      const responseData = await PlaybookAPI.shareAdvanced(selectedPlaybook.id, finalPayload);

      if (responseData && responseData.results) {
        setShareResults(responseData.results);
        const allSuccessful = responseData.results.every(r => r.success);
        if (allSuccessful && responseData.results.length > 0) {
          refreshAllPlaybookData();
        }
      } else {
        setShareError("Unexpected response format from the server.");
        setShareResults([{ email: 'N/A', success: false, message: 'Unexpected response format.' }]);
      }
    } catch (error: any) {
      setShareError(error.message || "Error sharing playbook.");
    } finally {
      setSharing(false);
    }
  };

  const handleClosePlaybookCard = () => {
    setOpenPlaybookCard(false);
    setSelectedPlaybook(undefined);
    setShareError(null);
    setEmailInputValue('');
  };

  const renderPlaybookCard = (playbook: Playbook | ImplementorPlaybook, type: 'my' | 'collaboration' | 'implementor') => {
    const pb = playbook as ImplementorPlaybook;
    const displayName = type === 'implementor' && pb.sourcePlaybook?.name ? pb.sourcePlaybook.name : playbook.name;

    const getIcon = () => {
      if (type === 'implementor') return <Copy className="h-4 w-4 text-oxford-blue" />;
      if (type === 'collaboration') return <Users className="h-4 w-4 text-oxford-blue" />;
      return <User className="h-4 w-4 text-oxford-blue" />;
    };

    return (
      <motion.div
        key={playbook.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="accent" className="h-full hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-oxford-blue line-clamp-1">
                  {displayName}
                </CardTitle>
                {getIcon()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleOpenShareModal(playbook); }}
                className="h-8 w-8 p-0 text-gold hover:text-gold hover:bg-gold/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
              {playbook.shortDescription || "No description available."}
            </CardDescription>
            <Button 
              variant="outline" 
              onClick={() => handleOpenPlaybookCard(playbook)} 
              className="w-full border-oxford-blue text-oxford-blue hover:bg-oxford-blue hover:text-white"
            >
              View
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderSkeletonCards = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );

  const renderSection = (
    title: string, 
    playbooksToList: Array<Playbook | ImplementorPlaybook>, 
    type: 'my' | 'collaboration' | 'implementor', 
    isLoading: boolean, 
    error: string | null
  ) => (
    <section className="section">
      <h2 className="section-title mb-6">
        {title}
      </h2>
      {isLoading ? (
        <div className="card-grid">
          {renderSkeletonCards(3)}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="link" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : playbooksToList.length > 0 ? (
        <div className="card-grid">
          {playbooksToList.map(p => renderPlaybookCard(p, type))}
        </div>
      ) : (
        <Card variant="ghost" className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="body-muted text-center">No playbooks in this section.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );

  return (
    <>
      <div className="min-h-screen bg-background">
      <div className="page-wrapper">
        {/* Header */}
        <div className="section-header mb-8">
          <div>
            <h1 className="heading-1">
              Welcome, {user?.email?.split('@')[0] || 'Admin'}
            </h1>
            <p className="body-muted mt-1">Manage your playbooks and processes</p>
          </div>
          <Button 
            onClick={handleShowPlaybookModal} 
            className="bg-oxford-blue hover:bg-oxford-blue/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Playbook
          </Button>
        </div>

        {/* Sections */}
        {renderSection("My Playbooks", myPlaybooks, 'my', loadingStates.my, errorStates.my)}
        {renderSection("Collaboration Playbooks", collaborationPlaybooks, 'collaboration', loadingStates.collaboration, errorStates.collaboration)}
        {renderSection("Implemented Playbooks", implementorPlaybooks, 'implementor', loadingStates.implementor, errorStates.implementor)}
      </div>
      </div>

      {/* Create Playbook Dialog - Size: sm (400px) */}
      <Dialog open={showCreatePlaybookModal} onOpenChange={setShowCreatePlaybook}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="text-oxford-blue">Create New Playbook</DialogTitle>
            <DialogDescription>
              Create a new playbook to organize your processes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePlaybook}>
            <DialogBody>
              <div className="space-y-4">
                {errorStates.my && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorStates.my}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={playbookName}
                    onChange={(e) => setPlaybookName(e.target.value)}
                    placeholder="Enter playbook name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={playbookDescription}
                    onChange={(e) => setPlaybookDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClosePlaybookModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!playbookName.trim() || loadingStates.my}
                className="bg-oxford-blue hover:bg-oxford-blue/90"
              >
                {loadingStates.my && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Playbook
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Playbook Dialog - Size: sm (400px) */}
      <Dialog open={openPlaybookCard} onOpenChange={setOpenPlaybookCard}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="text-oxford-blue">
              {selectedPlaybook?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPlaybook?.shortDescription || "No description available."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClosePlaybookCard}>
              Close
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                if (selectedPlaybook) {
                  handleOpenShareModal(selectedPlaybook);
                }
                setOpenPlaybookCard(false);
              }}
              className="bg-gold text-oxford-blue hover:bg-gold/90"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button 
              onClick={() => router.push(`/playbook/${selectedPlaybook?.id}`)}
              className="bg-oxford-blue hover:bg-oxford-blue/90"
            >
              Open Playbook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog - Size: md (560px) with scrollable body */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-oxford-blue">
              Share {selectedPlaybook?.name}
            </DialogTitle>
            <DialogDescription>
              Invite others to collaborate or implement this playbook.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4">
              {shareError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{shareError}</AlertDescription>
                </Alert>
              )}

              {shareResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Sharing Results:</Label>
                  {shareResults.map((res, index) => (
                    <Alert key={index} variant={res.success ? 'default' : 'destructive'} 
                      className={res.success ? 'bg-green-50 border-green-200' : ''}>
                      <AlertDescription>
                        <strong>{res.email}:</strong> {res.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label>User Emails</Label>
                <div className="flex gap-2">
                  <Input
                    ref={emailInputRef}
                    type="email"
                    value={emailInputValue}
                    onChange={(e) => setEmailInputValue(e.target.value)}
                    placeholder="user@example.com"
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}}
                  />
                  <Button type="button" variant="outline" onClick={handleAddEmail}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Email List */}
              {emailsToShare.length > 0 && (
                <div className="border border-border/50 rounded-lg p-3 space-y-2 bg-muted/30">
                  <Label className="text-sm">Users to be invited:</Label>
                  {emailsToShare.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-2 bg-card rounded shadow-sm">
                      <span className="text-sm">{e.email}</span>
                      <div className="flex items-center gap-2">
                        {e.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {e.status === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {e.status === 'invalid' && <span title={e.error}><XCircle className="h-4 w-4 text-destructive" /></span>}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveEmail(e.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Share Type */}
              <div className="space-y-3">
                <Label>Share As</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="IMPLEMENTOR"
                      checked={shareType === 'IMPLEMENTOR'}
                      onChange={(e) => setShareType(e.target.value as ShareType)}
                      className="text-oxford-blue"
                    />
                    <span className="text-sm">Implementor (Share as Copy)</span>
                    <span title="Creates a complete independent copy"><HelpCircle className="h-4 w-4 text-muted-foreground" /></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="COLLABORATOR"
                      checked={shareType === 'COLLABORATOR'}
                      onChange={(e) => setShareType(e.target.value as ShareType)}
                      className="text-oxford-blue"
                    />
                    <span className="text-sm">Collaborator (Grant Access)</span>
                    <span title="Grants access to this playbook"><HelpCircle className="h-4 w-4 text-muted-foreground" /></span>
                  </label>
                </div>
              </div>

              {/* Collaborator Role */}
              {shareType === 'COLLABORATOR' && (
                <div className="space-y-2">
                  <Label>Collaborator Role</Label>
                  <Select value={collaboratorRole} onValueChange={(v) => setCollaboratorRole(v as PrismaRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PrismaRole.COLLABORATOR}>Collaborator (View & Edit)</SelectItem>
                      <SelectItem value={PrismaRole.ADMIN}>Admin (Full Control)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseShareModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSharePlaybook}
              disabled={sharing || emailsToShare.filter(e => e.status === 'valid').length === 0}
              className="bg-gold text-oxford-blue hover:bg-gold/90"
            >
              {sharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
