'use client'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, X, Pencil, Sparkles, Search, Info, AlertCircle } from 'lucide-react'
import { fetchAuth } from '@/lib/auth'
import {
  CATEGORIES_COMPETENCE, DESCRIPTION_COMPETENCE_MIN, DESCRIPTION_COMPETENCE_MAX
} from '@/lib/referentiels'
import {
  Table, Th, Td, EmptyRow, StatutBadge, VerifyButton, DetailsButton, ActionCell,
  ChartCard, ChartTitle, ChartSubtitle, SearchBarWrapper, SearchIcon, SearchInput
} from '@/components/styleAdminDashboard'

/* =====================================================================
   ONGLET « COMPÉTENCES » DU TABLEAU DE BORD D'ADMINISTRATION

   Le référentiel de compétences alimente trois mécanismes : la saisie des
   profils et des offres, la lecture automatique des CV, et la
   recommandation. Pour cette dernière, la description compte autant que
   le nom : la proximité entre deux compétences est d'abord mesurée sur le
   vocabulaire de leurs descriptions. D'où l'aide à la rédaction, et
   l'affichage des compétences voisines après chaque enregistrement : il
   montre immédiatement si la description rapproche la compétence de
   celles qu'on attendait.
   ===================================================================== */

const LIBELLE_CATEGORIE = Object.fromEntries(CATEGORIES_COMPETENCE.map(c => [c.valeur, c.libelle]))

const champ = {
  width: '100%', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box',
  border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none', fontFamily: 'inherit',
  background: 'white', color: '#1e293b'
}
const etiquette = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }
const aide = { fontSize: 12, color: '#64748b', marginTop: 5, lineHeight: 1.45 }

function Compteur({ texte }) {
  const n = texte.trim().length
  const trop = n > DESCRIPTION_COMPETENCE_MAX
  const court = n < DESCRIPTION_COMPETENCE_MIN
  return (
    <span style={{ fontSize: 12, color: trop || court ? '#b45309' : '#4d7c0f' }}>
      {n} / {DESCRIPTION_COMPETENCE_MAX} caractères
      {court && ` (au moins ${DESCRIPTION_COMPETENCE_MIN})`}
    </span>
  )
}

function Voisines({ titre, proches }) {
  if (!proches) return null
  return (
    <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10,
                  background: '#f5f3eb', border: '1px solid #e7dcc9' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#6b5744', marginBottom: 6 }}>
        <Sparkles size={13} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 6 }} />
        {titre}
      </div>
      {proches.length === 0 ? (
        <div style={{ fontSize: 13, color: '#92400e' }}>
          Aucune compétence n&apos;est jugée proche. Si vous en attendiez, enrichissez la
          description avec les termes qu&apos;elle partage avec ses voisines naturelles.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {proches.map(p => (
            <span key={p.idCompetenceReference} style={{
              fontSize: 12.5, padding: '5px 10px', borderRadius: 20,
              background: 'white', border: '1px solid #d4b89d', color: '#334155'
            }}>
              <strong>{p.nom}</strong> · {Math.round(p.similarite * 100)} %
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminCompetences({ notifier }) {
  const [competences, setCompetences] = useState([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('')

  const vide = { nom: '', categorie: '', description: '' }
  const [nouvelle, setNouvelle] = useState(vide)
  const [envoi, setEnvoi] = useState(false)
  const [erreurAjout, setErreurAjout] = useState('')
  const [dernierAjout, setDernierAjout] = useState(null)

  const [edition, setEdition] = useState(null)       // { id, nom, categorie, description }
  const [erreurEdition, setErreurEdition] = useState('')
  const [proches, setProches] = useState({})          // id -> liste

  const charger = async () => {
    try {
      const res = await fetchAuth('/api/admin/competences')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setCompetences(data.competences)
    } catch (e) {
      notifier(e.message, 'error')
    } finally {
      setChargement(false)
    }
  }
  useEffect(() => { charger() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const liste = useMemo(() => {
    const s = recherche.toLowerCase().trim()
    return competences.filter(c =>
      (!filtreCategorie || c.categorieCompetenceReference === filtreCategorie) &&
      (!s || c.nomCompetenceReference.toLowerCase().includes(s) ||
             (c.description || '').toLowerCase().includes(s)))
  }, [competences, recherche, filtreCategorie])

  const ajouter = async (e) => {
    e.preventDefault()
    setErreurAjout('')
    setEnvoi(true)
    try {
      const res = await fetchAuth('/api/admin/competences', {
        method: 'POST', body: JSON.stringify(nouvelle)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ajout impossible')
      setCompetences(c => [...c, data.competence])
      setDernierAjout({ nom: data.competence.nomCompetenceReference, proches: data.proches })
      setNouvelle(vide)
      notifier(data.message, 'success')
    } catch (err) {
      setErreurAjout(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerEdition = async () => {
    setErreurEdition('')
    try {
      const res = await fetchAuth('/api/admin/competences', {
        method: 'PATCH',
        body: JSON.stringify({
          idCompetenceReference: edition.id, nom: edition.nom,
          categorie: edition.categorie, description: edition.description
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Modification impossible')
      setCompetences(cs => cs.map(c => c.idCompetenceReference === edition.id
        ? { ...c, ...data.competence } : c))
      setProches(p => ({ ...p, [edition.id]: data.proches }))
      setEdition(null)
      notifier(data.message, 'success')
    } catch (err) {
      setErreurEdition(err.message)
    }
  }

  const voirProches = async (id) => {
    if (proches[id]) { setProches(p => { const q = { ...p }; delete q[id]; return q }); return }
    const res = await fetchAuth(`/api/admin/competences?proches=${id}`)
    const data = await res.json()
    if (res.ok) setProches(p => ({ ...p, [id]: data.proches }))
  }

  const descriptionValide = (d) =>
    d.trim().length >= DESCRIPTION_COMPETENCE_MIN && d.trim().length <= DESCRIPTION_COMPETENCE_MAX

  return (
    <div style={{ padding: 20 }}>
      {/* ===== Ajout ===== */}
      <ChartCard style={{ marginBottom: 22 }}>
        <ChartTitle><Plus size={17} strokeWidth={2} />Ajouter une compétence au référentiel</ChartTitle>
        <ChartSubtitle>
          Une compétence ajoutée devient aussitôt disponible dans les profils des étudiants, les
          offres des entreprises et la lecture automatique des CV.
        </ChartSubtitle>

        <form onSubmit={ajouter} style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16 }}>
            <div>
              <label style={etiquette}>Nom *</label>
              <input style={champ} value={nouvelle.nom} maxLength={100}
                placeholder="Ex : Flutter"
                onChange={(e) => setNouvelle({ ...nouvelle, nom: e.target.value })} />
              <div style={aide}>
                Le nom tel qu&apos;il apparaît dans les CV et les offres : c&apos;est lui que la
                lecture automatique recherche.
              </div>
            </div>
            <div>
              <label style={etiquette}>Catégorie *</label>
              <select style={champ} value={nouvelle.categorie}
                onChange={(e) => setNouvelle({ ...nouvelle, categorie: e.target.value })}>
                <option value="">Choisir une catégorie</option>
                {CATEGORIES_COMPETENCE.map(c => <option key={c.valeur} value={c.valeur}>{c.libelle}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={etiquette}>Description *</label>
            <textarea style={{ ...champ, minHeight: 84, resize: 'vertical' }}
              value={nouvelle.description} maxLength={DESCRIPTION_COMPETENCE_MAX + 50}
              placeholder="Ex : Framework de Google pour développer des applications mobiles multiplateformes en Dart, avec une même base de code pour Android et iOS"
              onChange={(e) => setNouvelle({ ...nouvelle, description: e.target.value })} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
              <div style={{ ...aide, marginTop: 0, maxWidth: 640 }}>
                <Info size={12} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 5 }} />
                La recommandation rapproche deux compétences d&apos;après les mots que partagent leurs
                descriptions. Dites ce que la compétence permet de faire, avec des termes précis :
                ceux-là mêmes qu&apos;emploieraient les descriptions de ses voisines (« applications
                mobiles », « bases de données relationnelles »…).
              </div>
              <Compteur texte={nouvelle.description} />
            </div>
          </div>

          {erreurAjout && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#b91c1c' }}>
              <AlertCircle size={13} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 5 }} />
              {erreurAjout}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <VerifyButton type="submit"
              disabled={envoi || !nouvelle.nom.trim() || !nouvelle.categorie || !descriptionValide(nouvelle.description)}>
              <Plus size={14} strokeWidth={2.5} /> {envoi ? 'Ajout...' : 'Ajouter au référentiel'}
            </VerifyButton>
          </div>
        </form>

        {dernierAjout && (
          <Voisines titre={`Compétences les plus proches de « ${dernierAjout.nom} »`}
            proches={dernierAjout.proches} />
        )}
      </ChartCard>

      {/* ===== Liste ===== */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <SearchBarWrapper style={{ flex: '1 1 280px' }}>
          <SearchIcon><Search size={16} strokeWidth={2} /></SearchIcon>
          <SearchInput type="text" placeholder="Rechercher une compétence ou un mot de sa description..."
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </SearchBarWrapper>
        <select style={{ ...champ, width: 220 }} value={filtreCategorie}
          onChange={(e) => setFiltreCategorie(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {CATEGORIES_COMPETENCE.map(c => <option key={c.valeur} value={c.valeur}>{c.libelle}</option>)}
        </select>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Compétence</Th><Th>Catégorie</Th><Th>Description</Th>
            <Th>Étudiants</Th><Th>Offres</Th><Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {chargement ? (
            <tr><EmptyRow colSpan={6}>Chargement du référentiel...</EmptyRow></tr>
          ) : liste.length === 0 ? (
            <tr><EmptyRow colSpan={6}>Aucune compétence ne correspond.</EmptyRow></tr>
          ) : liste.map(c => {
            const id = c.idCompetenceReference
            const enEdition = edition?.id === id
            return (
              <tr key={id}>
                <Td style={{ minWidth: 150 }}>
                  {enEdition
                    ? <input style={champ} value={edition.nom} maxLength={100}
                        onChange={(e) => setEdition({ ...edition, nom: e.target.value })} />
                    : <strong>{c.nomCompetenceReference}</strong>}
                </Td>
                <Td style={{ minWidth: 130 }}>
                  {enEdition
                    ? <select style={champ} value={edition.categorie}
                        onChange={(e) => setEdition({ ...edition, categorie: e.target.value })}>
                        {CATEGORIES_COMPETENCE.map(k => <option key={k.valeur} value={k.valeur}>{k.libelle}</option>)}
                      </select>
                    : <StatutBadge $variant="verifie">{LIBELLE_CATEGORIE[c.categorieCompetenceReference] || c.categorieCompetenceReference}</StatutBadge>}
                </Td>
                <Td style={{ maxWidth: 460 }}>
                  {enEdition ? (
                    <>
                      <textarea style={{ ...champ, minHeight: 90, resize: 'vertical' }}
                        value={edition.description}
                        onChange={(e) => setEdition({ ...edition, description: e.target.value })} />
                      <Compteur texte={edition.description} />
                      {erreurEdition && (
                        <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 4 }}>{erreurEdition}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: c.description ? '#334155' : '#b45309' }}>
                        {c.description || 'Aucune description : cette compétence ne peut être rapprochée d’aucune autre.'}
                      </span>
                      {proches[id] && <Voisines titre="Compétences les plus proches" proches={proches[id]} />}
                    </>
                  )}
                </Td>
                <Td>{c.etudiants}</Td>
                <Td>{c.offres}</Td>
                <Td>
                  <ActionCell>
                    {enEdition ? (
                      <>
                        <VerifyButton onClick={enregistrerEdition}
                          disabled={!edition.nom.trim() || !descriptionValide(edition.description)}>
                          <Save size={13} strokeWidth={2} /> Enregistrer
                        </VerifyButton>
                        <DetailsButton onClick={() => { setEdition(null); setErreurEdition('') }}>
                          <X size={13} strokeWidth={2} /> Annuler
                        </DetailsButton>
                      </>
                    ) : (
                      <>
                        <DetailsButton onClick={() => setEdition({
                          id, nom: c.nomCompetenceReference,
                          categorie: c.categorieCompetenceReference,
                          description: c.description || ''
                        })}>
                          <Pencil size={13} strokeWidth={2} /> Modifier
                        </DetailsButton>
                        <DetailsButton onClick={() => voirProches(id)}>
                          <Sparkles size={13} strokeWidth={2} /> {proches[id] ? 'Masquer' : 'Proches'}
                        </DetailsButton>
                      </>
                    )}
                  </ActionCell>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <div style={{ ...aide, marginTop: 12 }}>
        <Info size={12} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 5 }} />
        Les compétences ne se suppriment pas : cela effacerait celles que des étudiants ont déclarées
        et que des offres exigent. Pour corriger une compétence, modifiez-la.
      </div>
    </div>
  )
}
