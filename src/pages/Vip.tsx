import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { subscribeVIP } from "@/lib/userService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, CheckCircle2, Loader2, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function VipPage() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Fake subscription plans
  const plans = [
    {
      id: "monthly",
      title: "1 Bulan",
      price: "Rp 49.000",
      description: "Akses memuaskan ke semua film dan drama favoritmu tanpa batas.",
      features: [
        "Nonton Bebas Iklan",
        "Kualitas Video HD",
        "Akses ke Semua Episode Premium",
        "Dapat Koin Ekstra Tiap Nonton"
      ]
    }, {
      id: "yearly",
      title: "1 Tahun",
      price: "Rp 399.000",
      description: "Lebih hemat hingga 30% dengan paket berlangganan tahunan.",
      features: [
        "Nonton Bebas Iklan",
        "Kualitas Video Full HD/4K",
        "Akses ke Semua Episode Premium",
        "Dapat Koin Ekstra Tiap Nonton",
        "Unduh untuk Nonton Offline"
      ],
      isPopular: true
    }
  ];

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsSubscribing(true);
    try {
      const success = await subscribeVIP(user.uid);
      if (success) {
        toast.success("Berhasil berlangganan VIP!", {
           description: "Sekarang kamu sudah bisa menikmati fitur premium!"
        });
        navigate('/profile');
      } else {
        toast.error("Gagal memproses langganan.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) {
     return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 pt-10">
        <Crown className="w-16 h-16 text-amber-500 mx-auto drop-shadow-md" />
        <h1 className="text-4xl font-extrabold tracking-tight">Menjadi VIP</h1>
        <p className="text-lg text-muted-foreground w-full max-w-lg mx-auto">
          Tonton tanpa batas, tanpa gangguan antrian dan dapatin uang dengan lebih cepat dan mudah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative flex flex-col ${plan.isPopular ? 'border-amber-500 border-2 shadow-amber-500/20 shadow-xl' : 'border-border'}`}>
             {plan.isPopular && (
               <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white font-bold px-4 py-1 rounded-full text-xs flex items-center gap-1 shadow-md">
                 <Star className="w-3 h-3 fill-white" />
                 Paling Populer
               </div>
             )}
             <CardHeader>
               <CardTitle className="text-2xl">{plan.title}</CardTitle>
               <CardDescription>{plan.description}</CardDescription>
             </CardHeader>
             <CardContent className="flex-1">
               <div className="mb-6">
                 <span className="text-4xl font-bold">{plan.price}</span>
               </div>
               <ul className="space-y-3">
                 {plan.features.map((feature, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm">
                     <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                     {feature}
                   </li>
                 ))}
               </ul>
             </CardContent>
             <CardFooter>
               <Button onClick={handleSubscribe} disabled={isSubscribing} className={`w-full ${plan.isPopular ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                 {isSubscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pilih Paket Ini'}
               </Button>
             </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center bg-primary/5 p-8 rounded-3xl border border-primary/10">
        <h2 className="text-xl font-bold">Gak mau bayar? Ada quest gratis!</h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Kamu bisa dapatin VIP Premium gratis cuma dengan login dan nonton video minimal 3 jam sehari selama 7 hari.
        </p>
        <Link to="/settings" className="inline-block mt-4">
          <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 px-8">
            Cek Progress Quest-mu
          </Button>
        </Link>
      </div>
    </div>
  );
}
