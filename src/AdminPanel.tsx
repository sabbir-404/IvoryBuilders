import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
  getDocs,
  where,
  Timestamp,
  FirestoreError
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Users, 
  Settings as SettingsIcon, 
  Mail, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  UserPlus,
  DollarSign,
  Calendar,
  MapPin,
  Heart,
  Home,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Permission Denied: ${operationType} on ${path}`);
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [outdoorImage, setOutdoorImage] = useState<string>('');
  const [googleFormUrl, setGoogleFormUrl] = useState<string>('');
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch applications
      const q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
      const unsubApps = onSnapshot(q, (snapshot) => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'applications');
      });

      // Fetch rent settings
      const unsubRent = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
        if (doc.exists()) {
          setMonthlyRent(doc.data().monthlyRent);
          setOutdoorImage(doc.data().outdoorImage || '');
          setGoogleFormUrl(doc.data().googleFormUrl || '');
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      });

      // Fetch visitor count
      const unsubVisits = onSnapshot(doc(db, 'stats', 'visits'), (doc) => {
        if (doc.exists()) {
          setVisitorCount(doc.data().visitorCount || 0);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'stats/visits');
      });

      return () => {
        unsubApps();
        unsubRent();
        unsubVisits();
      };
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);
    
    try {
      const email = username.includes('@') ? username : `${username}@azmeree.com`;
      console.log('Attempting login for:', email);
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
        
        // Ensure admin document exists for hardcoded admins
        const hardcodedEmails = ['islam@azmeree.com', 'sabbir@azmeree.com', 'SABBIRISLAMALVI070800@gmail.com'];
        if (hardcodedEmails.includes(email)) {
          await setDoc(doc(db, 'admins', userCredential.user.uid), {
            username: username.split('@')[0],
            role: 'admin',
            isHardcoded: true
          }, { merge: true });
        }
        
        toast.success('Logged in successfully');
      } catch (signInError: any) {
        console.log('Sign in failed with code:', signInError.code);
        
        // Handle bootstrap admin creation
        const isBootstrapAdmin = username === 'islam' && password === 'Noor@#9083';
        const isUserNotFound = signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential';
        
        if (isBootstrapAdmin && isUserNotFound) {
          console.log('Attempting to bootstrap default admin...');
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Default admin created successfully');
            // Ensure admin document exists
            await setDoc(doc(db, 'admins', userCredential.user.uid), {
              username: 'islam',
              role: 'admin',
              isBootstrap: true
            }, { merge: true });
            toast.success('Default admin account created and logged in');
          } catch (createError: any) {
            console.log('Create user failed with code:', createError.code);
            if (createError.code === 'auth/email-already-in-use') {
              throw new Error('Invalid password for this admin account.');
            }
            throw createError;
          }
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Login catch block:', error.code, error.message);
      let message = error.message;
      if (error.code === 'auth/invalid-credential') message = 'Invalid username or password.';
      if (error.code === 'auth/user-not-found') message = 'User not found.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
      toast.error('Login failed: ' + message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    onClose();
  };

  const updateRent = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        monthlyRent, 
        outdoorImage,
        googleFormUrl,
        updatedAt: Timestamp.now() 
      }, { merge: true });
      toast.success('Settings updated successfully');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  };

  const updateStatus = async (id: string, status: string, email: string) => {
    try {
      await updateDoc(doc(db, 'applications', id), { status });
      toast.success(`Application ${status}`);
      
      if (status === 'approved') {
        console.log(`Simulating email sent to ${email} with rent approval and accept button.`);
        toast.info(`Approval email simulated for ${email}`);
      }
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);
    
    try {
      const email = `${newAdminUsername}@azmeree.com`;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, newAdminPassword);
        await setDoc(doc(db, 'admins', userCredential.user.uid), {
          username: newAdminUsername,
          role: 'admin',
          createdAt: Timestamp.now()
        });
        toast.success(`New admin ${newAdminUsername} created successfully`);
        setNewAdminUsername('');
        setNewAdminPassword('');
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          toast.error(`The user ${email} already exists in authentication. If they are missing from the database, they should log in once to self-onboard.`);
        } else {
          throw authError;
        }
      }
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'admins');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user) {
    return (
      <div className="fixed inset-0 z-[110] bg-brand-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to manage Azmeree Ivory Builders</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="e.g. islam"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="rounded-xl"
                />
              </div>
              <Button 
                type="submit" 
                disabled={authLoading}
                className="w-full bg-brand-black text-brand-white rounded-full py-6"
              >
                {authLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-brand-white flex flex-col overflow-hidden">
      <header className="border-b px-4 md:px-8 py-4 md:py-6 flex justify-between items-center bg-brand-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-black rounded-lg md:rounded-xl flex items-center justify-center text-brand-white font-serif font-bold text-xs md:text-base">A</div>
          <div>
            <h1 className="text-sm md:text-lg font-serif font-bold">Admin Dashboard</h1>
            <p className="text-[8px] md:text-xs text-brand-black/40 uppercase tracking-widest">Azmeree Ivory Builders</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="outline" onClick={onClose} size="sm" className="rounded-full text-[10px] md:text-xs h-8 md:h-10">View Site</Button>
          <Button variant="ghost" onClick={handleLogout} size="sm" className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 h-8 md:h-10 text-[10px] md:text-xs">
            <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <Tabs defaultValue="applications" className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="w-full whitespace-nowrap mb-6">
              <TabsList className="bg-brand-gray p-1 rounded-2xl inline-flex w-full md:w-fit">
                <TabsTrigger value="applications" className="rounded-xl px-4 md:px-8 py-2 md:py-2.5 data-[state=active]:bg-brand-white data-[state=active]:shadow-sm text-xs md:text-sm flex-1 md:flex-none">
                  <Users className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                  Applications
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl px-4 md:px-8 py-2 md:py-2.5 data-[state=active]:bg-brand-white data-[state=active]:shadow-sm text-xs md:text-sm flex-1 md:flex-none">
                  <SettingsIcon className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                  App Settings
                </TabsTrigger>
                <TabsTrigger value="admins" className="rounded-xl px-4 md:px-8 py-2 md:py-2.5 data-[state=active]:bg-brand-white data-[state=active]:shadow-sm text-xs md:text-sm flex-1 md:flex-none">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                  Manage Admins
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            <TabsContent value="applications" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full pr-4">
                <div className="grid gap-6">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                    <Card className="border-none shadow-sm bg-brand-black text-brand-white rounded-2xl">
                      <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-brand-white/60 text-[10px] uppercase tracking-widest">Total Visits</CardDescription>
                        <CardTitle className="text-xl md:text-2xl font-serif">{visitorCount.toLocaleString()}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="border-none shadow-sm bg-brand-gray/50 rounded-2xl">
                      <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-brand-black/40 text-[10px] uppercase tracking-widest">Applications</CardDescription>
                        <CardTitle className="text-xl md:text-2xl font-serif">{applications.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="border-none shadow-sm bg-brand-gray/50 rounded-2xl sm:col-span-2 flex flex-row items-center justify-between p-4 min-h-[90px]">
                      <div className="space-y-1 overflow-hidden pr-2">
                        <span className="text-brand-black/40 text-[10px] uppercase tracking-widest block font-bold">Google Form Link</span>
                        <span className="text-xs text-brand-black/70 font-mono truncate block" title={googleFormUrl || 'Not Configured'}>
                          {googleFormUrl || 'Not Configured'}
                        </span>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        {googleFormUrl ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="rounded-xl h-9 w-9 bg-brand-white hover:bg-brand-gray/30 border border-brand-black/10 shadow-sm"
                              title="Copy Google Form Link"
                              onClick={() => {
                                navigator.clipboard.writeText(googleFormUrl);
                                toast.success('Google Form link copied!');
                              }}
                            >
                              <Copy className="w-4 h-4 text-brand-black" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="rounded-xl h-9 w-9 bg-brand-white hover:bg-brand-gray/30 border border-brand-black/10 shadow-sm"
                              title="Open Form in New Tab"
                              onClick={() => window.open(googleFormUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 text-brand-black" />
                            </Button>
                          </>
                        ) : (
                          <div className="text-[10px] text-brand-black/40 italic leading-snug max-w-[120px] text-right">
                            Configure link in App Settings
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center py-24 bg-brand-gray rounded-3xl border-2 border-dashed">
                      <Users className="w-12 h-12 mx-auto text-brand-black/10 mb-4" />
                      <p className="text-brand-black/40 font-medium">No applications yet</p>
                    </div>
                  ) : (
                    applications.map((app) => (
                      <Card key={app.id} className="border-none shadow-sm bg-brand-gray/50 hover:bg-brand-gray transition-colors rounded-3xl">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-serif">{app.name}</CardTitle>
                            <CardDescription className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" /> {app.email}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`rounded-full px-4 py-1 uppercase text-[10px] tracking-widest ${
                              app.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              app.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {app.status || 'pending'}
                          </Badge>
                        </CardHeader>
                        <CardContent className="py-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center text-xs md:text-sm text-brand-black/60">
                                <Calendar className="w-4 h-4 mr-2 opacity-40 shrink-0" />
                                <span>DOB: {app.dob || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center text-xs md:text-sm text-brand-black/60">
                                <MapPin className="w-4 h-4 mr-2 opacity-40 shrink-0" />
                                <span className="truncate">NID/Passport: {app.nid || 'Not provided'}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center text-xs md:text-sm text-brand-black/60">
                                <Heart className="w-4 h-4 mr-2 opacity-40 shrink-0" />
                                <span className="capitalize">Marital: {app.maritalStatus || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center text-xs md:text-sm text-brand-black/60">
                                <Home className="w-4 h-4 mr-2 opacity-40 shrink-0" />
                                <span>Family: {app.familyMembers || '1'} members</span>
                              </div>
                            </div>
                            <div className="flex flex-col justify-end space-y-2">
                              {app.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={() => updateStatus(app.id, 'approved', app.email)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10 md:h-11 text-xs"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                                    Approve
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => updateStatus(app.id, 'rejected', app.email)}
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-10 md:h-11 text-xs"
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {app.status === 'approved' && (
                                <p className="text-[10px] md:text-xs text-green-600 font-medium text-center italic leading-tight">
                                  Approval email sent. Waiting for tenant to accept rent.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Toggle expand button */}
                          <div className="pt-2 border-t border-brand-black/5 flex justify-between items-center text-xs">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-black/40">
                              Applicant Dossier
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                              className="inline-flex items-center space-x-1.5 text-brand-black/60 hover:text-brand-black font-bold uppercase tracking-wider text-[10px] cursor-pointer bg-brand-white/80 hover:bg-brand-white px-3 py-1.5 rounded-full border border-brand-black/5 transition-all"
                            >
                              <span>{expandedAppId === app.id ? 'Collapse Dossier' : 'View Full Dossier'}</span>
                              {expandedAppId === app.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Full Expanded Profile Area */}
                          {expandedAppId === app.id && (
                            <div className="mt-4 pt-4 border-t border-brand-black/5 grid md:grid-cols-2 gap-6 text-xs text-brand-black/75 animate-fadeIn">
                              {/* Left column */}
                              <div className="space-y-4">
                                <div className="space-y-1 bg-brand-white p-4 rounded-2xl border border-brand-black/5">
                                  <p className="text-[9px] uppercase tracking-wider font-bold text-brand-black/40">Personal Demographics</p>
                                  <p><strong>Nationality:</strong> {app.nationality || 'Bangladeshi'}</p>
                                  <p><strong>Religion:</strong> {app.religion || 'Islam'}</p>
                                  <p><strong>NID / Passport:</strong> {app.nid || 'Not provided'}</p>
                                  <p><strong>Phone:</strong> {app.phone || 'Not provided'}</p>
                                </div>

                                <div className="space-y-1 bg-brand-white p-4 rounded-2xl border border-brand-black/5">
                                  <p className="text-[9px] uppercase tracking-wider font-bold text-brand-black/40">Employment & Profession</p>
                                  <p><strong>Profession / Occupation:</strong> {app.profession || 'Not provided'}</p>
                                  <p><strong>Employer / Company:</strong> {app.orgName || 'Not provided'}</p>
                                  <p><strong>Position / Designation:</strong> {app.orgPosition || 'Not provided'}</p>
                                  <p><strong>Office Phone:</strong> {app.officePhone || 'N/A'}</p>
                                  <p className="whitespace-pre-line leading-relaxed"><strong>Office Address:</strong> {app.officeAddress || 'N/A'}</p>
                                </div>

                                <div className="space-y-1 bg-brand-white p-4 rounded-2xl border border-brand-black/5">
                                  <p className="text-[9px] uppercase tracking-wider font-bold text-brand-black/40">Addresses</p>
                                  <p className="whitespace-pre-line leading-relaxed pb-2 border-b border-brand-black/5"><strong>Present Address:</strong><br />{app.presentAddress || 'N/A'}</p>
                                  <p className="whitespace-pre-line leading-relaxed pt-2"><strong>Permanent Address:</strong><br />{app.permanentAddress || 'N/A'}</p>
                                </div>
                              </div>

                              {/* Right column */}
                              <div className="space-y-4">
                                <div className="space-y-1 bg-brand-white p-4 rounded-2xl border border-brand-black/5">
                                  <p className="text-[9px] uppercase tracking-wider font-bold text-brand-black/40">Previous Residence & Household Details</p>
                                  <p className="whitespace-pre-line leading-relaxed border-b border-brand-black/5 pb-2"><strong>Previous Address:</strong><br />{app.prevAddress || 'Not provided'}</p>
                                  <p className="whitespace-pre-line leading-relaxed border-b border-brand-black/5 py-2"><strong>Reason for Leaving:</strong><br />{app.prevReason || 'Not provided'}</p>
                                  <p className="pt-2"><strong>Keep Pets:</strong> {app.pets || 'No'} {app.petsDetails ? `(${app.petsDetails})` : ''}</p>
                                  <p><strong>Expected Move-In Date:</strong> {app.moveInDate || 'Not provided'}</p>
                                </div>

                                <div className="space-y-1 bg-brand-white p-4 rounded-2xl border border-brand-black/5">
                                  <p className="text-[9px] uppercase tracking-wider font-bold text-brand-black/40">Emergency Contacts</p>
                                  <p><strong>Emergency Contact Name:</strong> {app.emergencyName || 'Not provided'}</p>
                                  <p><strong>Relationship:</strong> {app.emergencyRelationship || 'Not provided'}</p>
                                  <p><strong>Phone:</strong> {app.emergencyPhone || 'Not provided'}</p>
                                </div>

                                {app.familyMembersList && app.familyMembersList.length > 0 && (
                                  <div className="space-y-2 bg-brand-white p-4 rounded-2xl border border-brand-black/5">
                                    <p className="text-[9px] uppercase tracking-wider font-bold text-brand-black/40">Co-Resident Family Members</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {app.familyMembersList.slice(0, parseInt(app.familyMembers) || 1).map((m: any, idx: number) => (
                                        <div key={idx} className="p-2 sm:p-2.5 bg-brand-gray/30 rounded-xl text-[11px] leading-tight flex justify-between">
                                          <div>
                                            <p className="font-semibold text-brand-black/90 text-left">Member {idx + 1}: {m.name || 'N/A'}</p>
                                            <p className="text-[9px] text-brand-black/50 text-left">Relation: {m.relationship || 'N/A'}</p>
                                          </div>
                                          {m.age && <Badge variant="outline" className="text-[10px] self-center capitalize h-fit">{m.age} years</Badge>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Card className="max-w-md border-none shadow-sm bg-brand-gray/50 rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-serif">App Settings</CardTitle>
                  <CardDescription>Manage monthly rent and featured images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rent">Monthly Rent (BDT)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40" />
                      <Input 
                        id="rent" 
                        type="number" 
                        value={monthlyRent} 
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        className="pl-12 py-6 rounded-xl bg-brand-white border-none shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outdoor-image">Outdoor Image URL</Label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40" />
                      <Input 
                        id="outdoor-image" 
                        value={outdoorImage} 
                        onChange={(e) => setOutdoorImage(e.target.value)}
                        placeholder="Public URL to exterior image"
                        className="pl-12 py-6 rounded-xl bg-brand-white border-none shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-form-url">Google Form URL</Label>
                    <div className="relative">
                      <SettingsIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/40" />
                      <Input 
                        id="google-form-url" 
                        value={googleFormUrl} 
                        onChange={(e) => setGoogleFormUrl(e.target.value)}
                        placeholder="e.g. https://docs.google.com/forms/d/e/.../viewform"
                        className="pl-12 py-6 rounded-xl bg-brand-white border-none shadow-sm"
                      />
                    </div>
                    <p className="text-[10px] text-brand-black/40 leading-normal pl-1">
                      Paste a Google Form link (e.g. standard viewform or embedded link). This updates the Google Form Tab on the website instantly.
                    </p>
                  </div>
                  <Button onClick={updateRent} className="w-full bg-brand-black text-brand-white rounded-full py-6">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins" className="mt-0">
              <Card className="max-w-md border-none shadow-sm bg-brand-gray/50 rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-serif">Create New Admin</CardTitle>
                  <CardDescription>Add another user to manage the property</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createAdmin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Username</Label>
                      <Input 
                        id="new-username" 
                        value={newAdminUsername} 
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        className="py-6 rounded-xl bg-brand-white border-none shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Password</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={newAdminPassword} 
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="py-6 rounded-xl bg-brand-white border-none shadow-sm"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-brand-black text-brand-white rounded-full py-6">
                      Create Admin Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
