import { Film, Search, User, LogOut, Loader2, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInWithGoogle, logout } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayAvatarUrl } from "@/lib/utils";

export function Navbar() {
  const [user, loading] = useAuthState(auth);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-1.5 rounded-md group-hover:scale-105 transition-transform duration-300">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-400">
            DramaBox
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <DropdownMenu>
             <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" />}>
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse flex"></span>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-64 p-2 shadow-2xl border-border/50" align="end">
               <div className="text-sm font-semibold mb-2 px-2">Notifikasi</div>
               <div className="space-y-1">
                 <div className="p-2 rounded-md bg-primary/10 text-primary text-xs">
                    <strong className="block mb-1">Misi Harian!</strong>
                    Jangan lupa check-in hari ini untuk dapatkan koin gratis.
                 </div>
                 <div className="p-2 rounded-md hover:bg-secondary text-xs cursor-pointer">
                    <strong className="block mb-1 text-foreground">🔥 Drama Baru Rilis!</strong>
                    <span className="text-muted-foreground">The Hidden Alpha Chapter 15 sudah rilis. Tonton sekarang.</span>
                 </div>
               </div>
             </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
            <Search className="w-5 h-5" />
          </Button>
          
          {loading ? (
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" />}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getDisplayAvatarUrl(user.photoURL)} alt={user.displayName || 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button nativeButton={false} render={<Link to="/auth" />} variant="default" size="sm" className="gap-2 rounded-full px-4">
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
