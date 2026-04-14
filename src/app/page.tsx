import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gem, Camera, MessageSquare, DollarSign, ArrowRight, Shield, Clock, TrendingUp } from "lucide-react";
import { SpotPriceTicker } from "@/components/shared/spot-price-ticker";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Spot price ticker */}
      <SpotPriceTicker />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <Gem className="h-4 w-4 text-amber-500" />
            AI-Powered Jewelry Appraisals
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Find out what your jewelry is worth{" "}
            <span className="text-amber-500">in 60 seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload a photo of your gold, silver, or platinum jewelry and get an
            instant AI-powered appraisal based on real-time metal prices. No
            account needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/appraisal">
              <Button size="lg" className="text-lg px-8">
                Get Free Appraisal <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <Camera className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg">1. Upload a Photo</h3>
                <p className="text-muted-foreground text-sm">
                  Take a photo of your jewelry item. Include any visible stamps
                  or markings for the best estimate.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <MessageSquare className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg">
                  2. Chat with Our AI
                </h3>
                <p className="text-muted-foreground text-sm">
                  Our appraiser AI analyzes your photo and asks a few targeted
                  questions to refine the assessment.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg">3. Get Your Value</h3>
                <p className="text-muted-foreground text-sm">
                  Receive an instant valuation based on current metal prices,
                  then book an appointment at a nearby shop.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div className="space-y-2">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="font-semibold">No Account Needed</h3>
              <p className="text-sm text-muted-foreground">
                Start your appraisal instantly. Only sign in to save or book.
              </p>
            </div>
            <div className="space-y-2">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="font-semibold">Under 60 Seconds</h3>
              <p className="text-sm text-muted-foreground">
                Most appraisals complete in under a minute with just a photo.
              </p>
            </div>
            <div className="space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="font-semibold">Real-Time Prices</h3>
              <p className="text-sm text-muted-foreground">
                Valuations use live metal spot prices updated every 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            PawnShop provides estimates based on material value only. Final
            offers depend on in-person professional evaluation. Not financial
            advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
