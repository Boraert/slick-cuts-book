// ─────────────────────────────────────────────────────────────
// ServicesTab.tsx
// Manages services: add, edit, toggle active, delete, export.
// State lives entirely inside this component.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Plus, PencilLine, Trash2, Save, X } from "lucide-react";
import type { Service, ServiceCategory } from "./Types";
import servicesData from "@/utils/services.json";

// ── Helpers ──────────────────────────────────────────────────

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export function processServicesData(data: any[]): Service[] {
  if (!Array.isArray(data)) return [];
  return data.map((s: any, i: number) => ({
    id:          String(s.id || generateId()),
    name:        String(s.name || `Service ${i + 1}`),
    description: s.description || null,
    price:       s.price ? Number(s.price) : null,
    category:    (s.category as ServiceCategory) || "men",
    is_active:   Boolean(s.is_active !== false),
    created_at:  s.created_at || new Date().toISOString(),
    tags:        Array.isArray(s.tags)     ? s.tags     : [],
    features:    Array.isArray(s.features) ? s.features : [],
    featured:    Boolean(s.featured),
  }));
}

function downloadServicesJSON(services: Service[]) {
  const blob = new Blob([JSON.stringify(services, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "services.json";
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

// ── Blank edit state ──────────────────────────────────────────

interface EditState {
  name: string; description: string; price: string;
  category: ServiceCategory; tags: string[]; features: string[]; featured: boolean;
}
const blankEdit = (): EditState => ({
  name: "", description: "", price: "", category: "men", tags: [], features: [], featured: false,
});

// ── Component ────────────────────────────────────────────────

export default function ServicesTab() {
  const [services, setServices] = useState<Service[]>(() =>
    processServicesData(servicesData as any[])
  );

  // Add-form state
  const [svcName,     setSvcName]     = useState("");
  const [svcDesc,     setSvcDesc]     = useState("");
  const [svcPrice,    setSvcPrice]    = useState("");
  const [svcCategory, setSvcCategory] = useState<ServiceCategory | undefined>(undefined);
  const [svcFeatures, setSvcFeatures] = useState<string[]>([]);
  const [svcTags,     setSvcTags]     = useState<string[]>([]);
  const [svcFeatured, setSvcFeatured] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSvc,   setEditSvc]   = useState<EditState>(blankEdit());

  const { toast } = useToast();

  // ── Add ───────────────────────────────────────────────────

  const addService = () => {
    if (!svcName.trim() || !svcCategory) {
      toast({ title: "Missing fields", description: "Name and Category are required.", variant: "destructive" });
      return;
    }
    const priceNum = svcPrice ? Number(svcPrice) : null;
    if (svcPrice && Number.isNaN(priceNum)) {
      toast({ title: "Invalid price", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }
    setServices((prev) => [
      ...prev,
      {
        id: generateId(), name: svcName.trim(), description: svcDesc.trim() || null,
        price: priceNum, category: svcCategory, is_active: true,
        created_at: new Date().toISOString(),
        tags: svcTags.filter(Boolean), features: svcFeatures.filter(Boolean), featured: svcFeatured,
      },
    ]);
    setSvcName(""); setSvcDesc(""); setSvcPrice(""); setSvcCategory(undefined);
    setSvcFeatures([]); setSvcTags([]); setSvcFeatured(false);
    toast({ title: "Service Added" });
  };

  // ── Toggle active ─────────────────────────────────────────

  const toggleActive = (id: string, val: boolean) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        toast({ title: "Updated", description: `${s.name} is now ${val ? "active" : "inactive"}`, duration: 2000 });
        return { ...s, is_active: val };
      })
    );
  };

  // ── Edit ──────────────────────────────────────────────────

  const startEdit = (svc: Service) => {
    setEditingId(svc.id);
    setEditSvc({
      name: svc.name, description: svc.description ?? "", price: svc.price != null ? String(svc.price) : "",
      category: svc.category, tags: svc.tags || [], features: svc.features || [], featured: svc.featured || false,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditSvc(blankEdit()); };

  const saveEdit = (id: string) => {
    if (!editSvc.name.trim()) {
      toast({ title: "Name required", variant: "destructive" }); return;
    }
    const priceNum = editSvc.price ? Number(editSvc.price) : null;
    if (editSvc.price && Number.isNaN(priceNum)) {
      toast({ title: "Invalid price", variant: "destructive" }); return;
    }
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: editSvc.name.trim(), description: editSvc.description.trim() || null,
              price: priceNum, category: editSvc.category,
              tags: editSvc.tags?.filter(Boolean) || [],
              features: editSvc.features?.filter(Boolean) || [],
              featured: editSvc.featured || false,
            }
          : s
      )
    );
    cancelEdit();
    toast({ title: "Saved", description: "Service updated." });
  };

  // ── Delete ────────────────────────────────────────────────

  const deleteService = (id: string) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    if (!confirm(`Delete "${svc.name}"?`)) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Deleted", description: `${svc.name} removed.` });
  };

  // ── Row renderer ──────────────────────────────────────────

  const renderRow = (svc: Service) => {
    const isEditing = editingId === svc.id;
    return (
      <TableRow key={svc.id}>
        {/* Name / description */}
        <TableCell className="font-medium">
          {isEditing ? (
            <div className="space-y-2">
              <Input value={editSvc.name}        onChange={(e) => setEditSvc((p) => ({ ...p, name:        e.target.value }))} placeholder="Service name" />
              <Input value={editSvc.description} onChange={(e) => setEditSvc((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
              <Input
                value={editSvc.tags?.join(", ") || ""}
                onChange={(e) => setEditSvc((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()) }))}
                placeholder="Tags (comma-separated)"
              />
              <Input
                value={editSvc.features?.join(", ") || ""}
                onChange={(e) => setEditSvc((p) => ({ ...p, features: e.target.value.split(",").map((f) => f.trim()) }))}
                placeholder="Features (comma-separated)"
              />
            </div>
          ) : (
            <div>
              <div className="font-medium">{svc.name}</div>
              {svc.description && <div className="text-sm text-muted-foreground">{svc.description}</div>}
              {!!svc.tags?.length     && <div className="text-xs text-blue-600 mt-1">Tags: {svc.tags.join(", ")}</div>}
              {!!svc.features?.length && <div className="text-xs text-green-600 mt-1">Features: {svc.features.join(", ")}</div>}
            </div>
          )}
        </TableCell>

        {/* Price */}
        <TableCell>
          {isEditing
            ? <Input inputMode="decimal" value={editSvc.price} onChange={(e) => setEditSvc((p) => ({ ...p, price: e.target.value }))} placeholder="Price" className="w-28" />
            : svc.price != null ? `DKK ${Number(svc.price).toFixed(0)}` : "—"}
        </TableCell>

        {/* Featured */}
        <TableCell>
          {isEditing
            ? <Checkbox checked={editSvc.featured} onCheckedChange={(v) => setEditSvc((p) => ({ ...p, featured: Boolean(v) }))} />
            : svc.featured ? <span className="text-yellow-500">⭐ Featured</span> : "—"}
        </TableCell>

        {/* Active */}
        <TableCell>
          <Switch
            key={`${svc.id}-${svc.is_active}`}
            checked={svc.is_active}
            onCheckedChange={(v) => toggleActive(svc.id, v)}
          />
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          {isEditing ? (
            <div className="flex justify-end gap-1">
              <Button size="sm" onClick={() => saveEdit(svc.id)}><Save className="h-3 w-3" /></Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="outline" onClick={() => startEdit(svc)}><PencilLine className="h-3 w-3" /></Button>
              <Button size="sm" variant="destructive" onClick={() => deleteService(svc.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = (list: Service[], empty: string) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map(renderRow)}
          {list.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">{empty}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const menServices    = services.filter((s) => s.category === "men");
  const womenServices  = services.filter((s) => s.category === "women");

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Export Services Data</CardTitle>
          <CardDescription>Download current services configuration as JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => downloadServicesJSON(services)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Download Services JSON
          </Button>
        </CardContent>
      </Card>

      {/* Add service */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add Service</CardTitle>
          <CardDescription>Add new services for men or women (stored locally)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="svc-name">Name</Label>
              <Input id="svc-name" placeholder="e.g. Classic Haircut" value={svcName} onChange={(e) => setSvcName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="svc-price">Price (DKK)</Label>
              <Input id="svc-price" placeholder="e.g. 250" inputMode="decimal" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={svcCategory} onValueChange={(v) => setSvcCategory(v as ServiceCategory)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Label htmlFor="svc-desc">Description</Label>
              <Input id="svc-desc" placeholder="Short description…" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
            </div>
            <div className="col-span-4">
              <Label htmlFor="svc-features">Features (comma-separated)</Label>
              <Input
                id="svc-features"
                placeholder="e.g. Precision cut, Professional styling"
                value={svcFeatures.join(", ")}
                onChange={(e) => setSvcFeatures(e.target.value.split(",").map((f) => f.trim()))}
              />
            </div>
            <div className="col-span-4">
              <Label htmlFor="svc-tags">Tags (comma-separated)</Label>
              <Input
                id="svc-tags"
                placeholder="e.g. Popular, Classic"
                value={svcTags.join(", ")}
                onChange={(e) => setSvcTags(e.target.value.split(",").map((t) => t.trim()))}
              />
            </div>
            <div className="col-span-4 flex items-center gap-2">
              <Checkbox checked={svcFeatured} onCheckedChange={(v) => setSvcFeatured(!!v)} />
              <Label>Featured Service</Label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addService}><Plus className="h-4 w-4 mr-2" /> Add Service</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Men's Services ({menServices.length})</CardTitle>
            <CardDescription>Active and inactive services for men</CardDescription>
          </CardHeader>
          <CardContent>{renderTable(menServices, "No services for men yet.")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Women's Services ({womenServices.length})</CardTitle>
            <CardDescription>Active and inactive services for women</CardDescription>
          </CardHeader>
          <CardContent>{renderTable(womenServices, "No services for women yet.")}</CardContent>
        </Card>
      </div>
    </div>
  );
}