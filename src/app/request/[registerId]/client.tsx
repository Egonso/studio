"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

export default function SupplierRequestForm({ registerId, organisationName }: { registerId: string, organisationName: string }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        supplierEmail: "",
        toolName: "",
        purpose: "",
        dataCategory: "",
        aiActCategory: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/supplier-submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registerId,
                    ...formData,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Fehler beim Übermitteln.");

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex bg-slate-50 items-center justify-center p-4">
                <Card className="max-w-md w-full border-green-100 shadow-sm">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-serif">Erfolgreich übermittelt</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Vielen Dank! Die Daten wurden sicher im AI Governance Register von {organisationName} hinterlegt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center space-y-4">
                            <h3 className="font-semibold text-primary">Ihre eigenen Systeme dokumentieren?</h3>
                            <p className="text-sm text-muted-foreground">
                                Nutzen Sie das EUKI Register, um Ihre eigenen KI-Werkzeuge kostenlos rechtssicher zu erfassen und Use-Case Pässe für Ihre Kunden zu generieren.
                            </p>
                            <Button className="w-full" asChild>
                                <a href="/register">Kostenlos Account erstellen <ArrowRight className="w-4 h-4 ml-2" /></a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-white border shadow-sm rounded-xl mb-3">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-serif text-slate-900">Compliance Datenerfassung</h1>
                    <p className="text-slate-600">
                        <strong>{organisationName}</strong> bittet Sie als Lieferant um die Übermittlung der Basis-Eckdaten zu Ihrem KI-System, um gesetzliche Dokumentationspflichten (AI Act & DSGVO) zu erfüllen.
                    </p>
                </div>

                <Card className="shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-6">
                            {error && (
                                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Ihre Arbeits-EMail (als Ansprechpartner)</Label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="name@ihrefirma.de"
                                        value={formData.supplierEmail}
                                        onChange={e => setFormData({ ...formData, supplierEmail: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Name des KI-Systems / Produkts</Label>
                                    <Input
                                        required
                                        placeholder="z.B. SuperAgent AI"
                                        value={formData.toolName}
                                        onChange={e => setFormData({ ...formData, toolName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Verwendungszweck (beim Kunden)</Label>
                                    <Textarea
                                        required
                                        rows={3}
                                        placeholder="Kurze Beschreibung, wofür das System konkret eingesetzt wird..."
                                        value={formData.purpose}
                                        onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Kategorie der verarbeiteten Daten</Label>
                                        <Select required onValueChange={val => setFormData({ ...formData, dataCategory: val })}>
                                            <SelectTrigger><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NO_PERSONAL_DATA">Keine personenbezogenen Daten</SelectItem>
                                                <SelectItem value="PERSONAL_DATA">Personenbezogene Daten (DSGVO)</SelectItem>
                                                <SelectItem value="SPECIAL_PERSONAL">Besondere personenbez. Daten (Art. 9)</SelectItem>
                                                <SelectItem value="INTERNAL_CONFIDENTIAL">Betriebsgeheimnisse</SelectItem>
                                                <SelectItem value="PUBLIC_DATA">Öffentlich zugängliche Daten</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Risikoklasse (gemäß EU AI Act)</Label>
                                        <Select required onValueChange={val => setFormData({ ...formData, aiActCategory: val })}>
                                            <SelectTrigger><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Minimales Risiko">Minimales Risiko</SelectItem>
                                                <SelectItem value="Geringes Risiko">Geringes Risiko (z.B. Chatbots)</SelectItem>
                                                <SelectItem value="Hochrisiko">Hochrisiko</SelectItem>
                                                <SelectItem value="Unbekannt">Noch unklar / Unbekannt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t p-6 pb-6 mt-4">
                            <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                {loading ? "Wird sicher übermittelt..." : `Daten an ${organisationName} übermitteln`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
