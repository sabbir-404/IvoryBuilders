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
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
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
  Home
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
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
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
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      });

      return () => {
        unsubApps();
        unsubRent();
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

  const handleGoogleLogin = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters to force account selection if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success('Logged in with Google');
    } catch (error: any) {
      console.error('Google login error:', error.code, error.message);
      if (error.code === 'auth/cancelled-popup-request') {
        toast.error('Login cancelled. Please try again and keep the popup window open.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups for this site.');
      } else {
        toast.error('Google login failed: ' + error.message);
      }
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
        updatedAt: Timestamp.now() 
      }, { merge: true });
      toast.success('Rent updated successfully');
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
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-brand-white px-2 text-brand-black/40">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full rounded-full py-6 border-brand-black/10"
              >
                {authLoading ? 'Connecting...' : 'Login with Google'}
              </Button>
              
              <div className="mt-6 p-4 bg-brand-gray/50 rounded-xl text-[10px] text-brand-black/40 leading-relaxed">
                <p className="font-bold mb-1 uppercase tracking-widest">Troubleshooting:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ensure Email/Password provider is enabled in Firebase Console.</li>
                  <li>Check if popups are allowed in your browser for Google Login.</li>
                  <li>Default admin: <strong>islam</strong> / <strong>Noor@#9083</strong></li>
                </ul>
              </div>
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
      <header className="border-b px-8 py-6 flex justify-between items-center bg-brand-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center text-brand-white font-serif font-bold">A</div>
          <div>
            <h1 className="text-lg font-serif font-bold">Admin Dashboard</h1>
            <p className="text-xs text-brand-black/40 uppercase tracking-widest">Azmeree Ivory Builders</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onClose} className="rounded-full">View Site</Button>
          <Button variant="ghost" onClick={handleLogout} className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <Tabs defaultValue="applications" className="flex-1 flex flex-col">
            <TabsList className="bg-brand-gray p-1 rounded-2xl mb-8 w-fit">
              <TabsTrigger value="applications" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-brand-white data-[state=active]:shadow-sm">
                <Users className="w-4 h-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-brand-white data-[state=active]:shadow-sm">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Rent Settings
              </TabsTrigger>
              <TabsTrigger value="admins" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-brand-white data-[state=active]:shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Manage Admins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full pr-4">
                <div className="grid gap-6">
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
                        <CardContent className="grid md:grid-cols-3 gap-6 py-6">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-brand-black/60">
                              <Calendar className="w-4 h-4 mr-2 opacity-40" />
                              <span>DOB: {app.dob}</span>
                            </div>
                            <div className="flex items-center text-sm text-brand-black/60">
                              <MapPin className="w-4 h-4 mr-2 opacity-40" />
                              <span>From: {app.residency}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-brand-black/60">
                              <Heart className="w-4 h-4 mr-2 opacity-40" />
                              <span className="capitalize">{app.maritalStatus}</span>
                            </div>
                            <div className="flex items-center text-sm text-brand-black/60">
                              <Home className="w-4 h-4 mr-2 opacity-40" />
                              <span>Family: {app.familyMembers} members</span>
                            </div>
                          </div>
                          <div className="flex flex-col justify-end space-y-2">
                            {app.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => updateStatus(app.id, 'approved', app.email)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateStatus(app.id, 'rejected', app.email)}
                                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-11"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {app.status === 'approved' && (
                              <p className="text-xs text-green-600 font-medium text-center italic">
                                Approval email sent. Waiting for tenant to accept rent.
                              </p>
                            )}
                          </div>
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
                  <CardTitle className="font-serif">Global Rent Configuration</CardTitle>
                  <CardDescription>Set the standard monthly rent for Azmeree Ivory Builders</CardDescription>
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
