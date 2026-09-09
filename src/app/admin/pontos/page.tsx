"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Check, MapPinned, Pencil, Trash2, X, Save, Plus } from "lucide-react";
import { searchAddresses, AddressResult } from "@/services/geocodingService";
import {
  createPonto,
  deletePonto,
  fetchAllPontosAdmin,
  updatePonto,
  NewPontoInput,
} from "@/services/pointsService";
import type { TouristPoint } from "@/types/point";

// Same debounce delay used elsewhere in the app for Photon requests.
const PHOTON_DEBOUNCE_MS = 400;

const ACCESSIBILITY_FIELDS: Array<{ key: keyof Pick<NewPontoInput, "acessibilidade_rampa" | "acessibilidade_audio" | "acessibilidade_braille" | "acessibilidade_libras">; label: string }> = [
  { key: "acessibilidade_rampa", label: "Rampas" },
  { key: "acessibilidade_audio", label: "Áudio" },
  { key: "acessibilidade_braille", label: "Braille" },
  { key: "acessibilidade_libras", label: "Libras" },
];

const emptyForm = {
  nome: "",
  categoria: "",
  cidade: "",
  descricao_curta: "",
  descricao_longa: "",
  imagem_capa: "",
  qr_code_value: "",
  pasta_imagens: "",
  acessibilidade_rampa: false,
  acessibilidade_audio: false,
  acessibilidade_braille: false,
  acessibilidade_libras: false,
};

type EditableFields = Pick<
  TouristPoint,
  "name" | "category" | "city" | "description"
> & {
  wheelchair: boolean;
  audio: boolean;
  braille: boolean;
  libras: boolean;
};

function pointToEditable(p: TouristPoint): EditableFields {
  return {
    name: p.name,
    category: p.category,
    city: p.city,
    description: p.description,
    wheelchair: p.accessibility.wheelchair,
    audio: p.accessibility.audio,
    braille: p.accessibility.braille,
    libras: p.accessibility.libras,
  };
}

/**
 * Admin panel — /admin/pontos (served at admin.rotasembarreiras.com.br/pontos
 * via proxy.ts's subdomain rewrite). Guarded by src/app/admin/layout.tsx
 * (is_admin check) and by the pontos_insert/update/delete_admin RLS
 * policies server-side (supabase/migrations_admin.sql).
 *
 * Two sections: cadastro form (address auto-geocoded via Photon, same
 * integration as SearchBar/SuggestLocationSheet) and a listing of every
 * ponto with inline edit for the text/accessibility fields + delete.
 */
export default function AdminPontosPage() {
  const [points, setPoints] = useState<TouristPoint[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableFields | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [enderecoQuery, setEnderecoQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressResult[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadPoints = async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await fetchAllPontosAdmin();
      setPoints(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Não foi possível carregar os pontos.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadPoints();
  }, []);

  // Debounced Photon geocoding — identical pattern to SearchBar/SuggestLocationSheet.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (enderecoQuery.trim().length < 3) {
      setAddressSuggestions([]);
      setIsLoadingAddresses(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoadingAddresses(true);
      searchAddresses(enderecoQuery, controller.signal)
        .then((results) => {
          setAddressSuggestions(results);
          setIsLoadingAddresses(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setIsLoadingAddresses(false);
        });
    }, PHOTON_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enderecoQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsAddressFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAddress = (address: AddressResult) => {
    // Latitude/longitude captured automatically from the Photon result —
    // no manual coordinate lookup needed.
    setSelectedAddress(address);
    setEnderecoQuery(address.label);
    setAddressSuggestions([]);
    setIsAddressFocused(false);
  };

  const handleEnderecoChange = (value: string) => {
    setEnderecoQuery(value);
    if (selectedAddress) setSelectedAddress(null);
  };

  const updateField = <K extends keyof typeof emptyForm>(key: K, value: typeof emptyForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    form.nome.trim().length > 0 &&
    form.categoria.trim().length > 0 &&
    form.cidade.trim().length > 0 &&
    selectedAddress !== null &&
    status !== "sending";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedAddress) return;

    setStatus("sending");
    setError("");
    try {
      const input: NewPontoInput = {
        nome: form.nome.trim(),
        categoria: form.categoria.trim(),
        cidade: form.cidade.trim(),
        latitude: selectedAddress.lat,
        longitude: selectedAddress.lng,
        endereco: selectedAddress.label,
        descricao_curta: form.descricao_curta.trim() || null,
        descricao_longa: form.descricao_longa.trim() || null,
        imagem_capa: form.imagem_capa.trim() || null,
        acessibilidade_rampa: form.acessibilidade_rampa,
        acessibilidade_audio: form.acessibilidade_audio,
        acessibilidade_braille: form.acessibilidade_braille,
        acessibilidade_libras: form.acessibilidade_libras,
        qr_code_value: form.qr_code_value.trim() || null,
        pasta_imagens: form.pasta_imagens.trim() || null,
      };
      await createPonto(input);
      setStatus("sent");
      setForm(emptyForm);
      setEnderecoQuery("");
      setSelectedAddress(null);
      await loadPoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar o ponto. Tente novamente.");
      setStatus("error");
    }
  };

  const startEdit = (point: TouristPoint) => {
    setEditingId(point.id);
    setEditDraft(pointToEditable(point));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft) return;
    setSavingId(id);
    try {
      await updatePonto(id, {
        nome: editDraft.name.trim(),
        categoria: editDraft.category.trim(),
        cidade: editDraft.city.trim(),
        descricao_curta: editDraft.description.trim() || null,
        acessibilidade_rampa: editDraft.wheelchair,
        acessibilidade_audio: editDraft.audio,
        acessibilidade_braille: editDraft.braille,
        acessibilidade_libras: editDraft.libras,
      });
      setEditingId(null);
      setEditDraft(null);
      await loadPoints();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Não foi possível salvar as alterações.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    try {
      await deletePonto(id);
      setPoints((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Não foi possível excluir o ponto.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="w-full min-h-dvh bg-bg-app py-10 px-6 flex flex-col items-center gap-10">
      <div ref={containerRef} className="w-full max-w-xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-text-main flex items-center gap-2.5">
            <MapPinned className="w-6 h-6 text-brand" />
            Cadastrar novo ponto
          </h1>
          <p className="text-sm text-text-secondary font-medium mt-1.5 leading-relaxed">
            O endereço abaixo usa a mesma busca Photon do app: selecione um resultado para preencher latitude/longitude automaticamente.
          </p>
        </div>

        {status === "sent" && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-md flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </span>
            <p className="text-sm font-bold text-text-main">Ponto cadastrado com sucesso. O formulário foi limpo para o próximo cadastro.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col gap-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Nome do local *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              required
              className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Categoria *</label>
              <input
                type="text"
                value={form.categoria}
                onChange={(e) => updateField("categoria", e.target.value)}
                placeholder="Ex: Patrimônio"
                required
                className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Cidade *</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
                placeholder="Ex: Governador Valadares"
                required
                className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
          </div>

          {/* Endereço — Photon autocomplete, geocode-on-select autofills lat/lng */}
          <div className="relative">
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Endereço *</label>
            <input
              type="text"
              value={enderecoQuery}
              onChange={(e) => handleEnderecoChange(e.target.value)}
              onFocus={() => setIsAddressFocused(true)}
              placeholder="Digite para buscar e selecionar o endereço..."
              required
              className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
            {selectedAddress && (
              <p className="mt-1.5 text-xs font-bold text-brand flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                lat {selectedAddress.lat.toFixed(6)}, lng {selectedAddress.lng.toFixed(6)}
              </p>
            )}

            {isAddressFocused && (addressSuggestions.length > 0 || isLoadingAddresses) && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                {isLoadingAddresses && addressSuggestions.length === 0 && (
                  <p className="px-5 py-4 text-sm text-text-secondary font-semibold">Buscando endereços...</p>
                )}
                <ul>
                  {addressSuggestions.map((address) => (
                    <li key={address.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectAddress(address)}
                        className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-b-0 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-text-secondary flex-shrink-0" />
                        <span className="flex-1 text-sm text-text-main font-semibold leading-snug">{address.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Descrição curta (card/preview)</label>
            <textarea
              value={form.descricao_curta}
              onChange={(e) => updateField("descricao_curta", e.target.value)}
              rows={2}
              className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Descrição longa (tela de detalhe, seção &quot;História&quot;)</label>
            <textarea
              value={form.descricao_longa}
              onChange={(e) => updateField("descricao_longa", e.target.value)}
              rows={4}
              className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary">URL da imagem de capa</label>
            <input
              type="text"
              value={form.imagem_capa}
              onChange={(e) => updateField("imagem_capa", e.target.value)}
              placeholder="https://.../pontos-imagens/.../capa.jpg"
              className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Valor do QR Code</label>
              <input
                type="text"
                value={form.qr_code_value}
                onChange={(e) => updateField("qr_code_value", e.target.value)}
                placeholder="rota-nome-do-local"
                className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">Pasta de imagens (Storage)</label>
              <input
                type="text"
                value={form.pasta_imagens}
                onChange={(e) => updateField("pasta_imagens", e.target.value)}
                placeholder="ex: ibituruna"
                className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
          </div>

          {/* Accessibility summary flags — plain yes/no, shown as chips
              (orange/brand vs dull gray) in the point detail screen. The
              detailed 3-state list ("tem"/"não tem"/"não verificado") is
              set separately per bullet item via Table Editor for now — no
              dedicated UI for editing acessibilidade_detalhes yet. */}
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary mb-3">Acessibilidade</h3>
            <div className="grid grid-cols-2 gap-3">
              {ACCESSIBILITY_FIELDS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text-main cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => updateField(key, e.target.checked)}
                    className="w-4.5 h-4.5 accent-brand"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {status === "error" && <p className="text-sm font-bold text-brand">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-full py-3.5 transition-colors active:scale-95"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Cadastrar ponto
              </>
            )}
          </button>
        </form>
      </div>

      {/* Listing + inline edit */}
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <h2 className="text-lg font-black text-text-main">Pontos cadastrados ({points.length})</h2>

        {listError && <p className="text-sm font-bold text-brand">{listError}</p>}

        {listLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : points.length === 0 ? (
          <p className="text-sm text-text-secondary font-medium">Nenhum ponto cadastrado ainda.</p>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-black uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Descrição curta</th>
                  <th className="px-4 py-3">Acessibilidade</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => {
                  const isEditing = editingId === point.id;
                  return (
                    <tr key={point.id} className="border-b border-gray-50 last:border-b-0 align-top">
                      {isEditing && editDraft ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              value={editDraft.name}
                              onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={editDraft.category}
                              onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={editDraft.city}
                              onChange={(e) => setEditDraft({ ...editDraft, city: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <textarea
                              value={editDraft.description}
                              onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              {(
                                [
                                  ["wheelchair", "Rampas"],
                                  ["audio", "Áudio"],
                                  ["braille", "Braille"],
                                  ["libras", "Libras"],
                                ] as const
                              ).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-1.5 text-xs font-semibold text-text-main">
                                  <input
                                    type="checkbox"
                                    checked={editDraft[key]}
                                    onChange={(e) => setEditDraft({ ...editDraft, [key]: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-brand"
                                  />
                                  {label}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveEdit(point.id)}
                                disabled={savingId === point.id}
                                className="p-2 rounded-full bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
                                aria-label="Salvar"
                              >
                                {savingId === point.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="p-2 rounded-full bg-gray-100 text-text-secondary hover:bg-gray-200 transition-colors"
                                aria-label="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-bold text-text-main">{point.name}</td>
                          <td className="px-4 py-3 text-text-secondary font-semibold">{point.category}</td>
                          <td className="px-4 py-3 text-text-secondary font-semibold">{point.city}</td>
                          <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{point.description}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs font-semibold">
                            {[
                              point.accessibility.wheelchair && "Rampas",
                              point.accessibility.audio && "Áudio",
                              point.accessibility.braille && "Braille",
                              point.accessibility.libras && "Libras",
                            ]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(point)}
                                className="p-2 rounded-full bg-gray-100 text-text-secondary hover:bg-gray-200 transition-colors"
                                aria-label={`Editar ${point.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(point.id, point.name)}
                                disabled={deletingId === point.id}
                                className="p-2 rounded-full bg-gray-100 text-brand hover:bg-brand-light disabled:opacity-50 transition-colors"
                                aria-label={`Excluir ${point.name}`}
                              >
                                {deletingId === point.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
