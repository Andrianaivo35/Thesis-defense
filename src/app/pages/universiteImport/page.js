'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import { anneeUniversitaireCourante, anneesProposees } from '@/lib/promotions'
import AppNavbar from '@/components/appNavbar'
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info,
  ArrowLeft, ArrowRight, Download, Users, TriangleAlert
} from 'lucide-react'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  StatsRow, StatCard, StatValue, StatLabel,
  CandidatureCard, OffreTitre, CardMeta, MetaItem,
  CardFooter, ActionButton, EmptyState, LoadingState
} from '@/components/styleEtudiantCandidature'

/* =====================================================================
   Import d'une promotion — écran en deux temps

   L'université dépose son fichier, VOIT ce qui va se passer, puis
   confirme. Le récapitulatif est ligne à ligne et porte les numéros de
   ligne du fichier : c'est ce qui permet de corriger dans le tableur
   sans jouer aux devinettes.
   ===================================================================== */

const MODELE = [
  'nom;prenom;email;matricule;niveau;filiere;specialisation',
  'Rakotondrabe;Jean;jean.rakotondrabe@exemple.mg;MAT-2026-001;Licence 3;Informatique et Numérique;Génie Logiciel',
  'Randrianasolo;Hanta;hanta.randrianasolo@exemple.mg;MAT-2026-002;Master 1;Gestion et Commerce;Comptabilité'
].join('\r\n')

export default function UniversiteImport() {
  const router = useRouter()
  const [fichier, setFichier] = useState(null)
  const [analyse, setAnalyse] = useState(null)
  const [resultat, setResultat] = useState(null)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [toutAfficher, setToutAfficher] = useState(false)
  const [promotion, setPromotion] = useState('')
  const [annee, setAnnee] = useState(anneeUniversitaireCourante())

  const envoyer = async (etape) => {
    setErreur(''); setEnCours(true)
    try {
      const formData = new FormData()
      formData.append('fichier', fichier)
      formData.append('etape', etape)
      if (etape === 'confirmation') {
        if (analyse?.empreinte) formData.append('empreinte', analyse.empreinte)
        formData.append('promotion', promotion.trim())
        formData.append('annee', annee)
      }
      const res = await fetchAuth('/api/universiteImport', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import impossible')

      if (etape === 'analyse') setAnalyse(data)
      else { setResultat(data); setAnalyse(null) }
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnCours(false)
    }
  }

  const choisirFichier = (f) => {
    setFichier(f); setAnalyse(null); setResultat(null); setErreur('')
  }

  /* Le modèle est engendré côté navigateur : pas de fichier statique à
     maintenir, et il porte l'encodage UTF-8 avec marque d'ordre d'octets
     pour qu'Excel l'ouvre sans abîmer les accents. */
  const telechargerModele = () => {
    const contenu = new Blob(['﻿' + MODELE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(contenu)
    const a = document.createElement('a')
    a.href = url; a.download = 'modele-import-etudiants.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const stats = analyse?.statistiques
  const lignes = analyse?.lignes || []
  const aProbleme = lignes.filter(l => !l.importable || l.avertissements.length > 0)
  const affichees = toutAfficher ? lignes : aProbleme.slice(0, 30)

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <FileSpreadsheet size={24} strokeWidth={2} />
            Importer une promotion
          </PageTitle>
          <PageSubtitle>
            Déposez un fichier CSV : vous verrez exactement ce qui sera créé avant
            que quoi que ce soit ne soit enregistré.
          </PageSubtitle>
        </PageHeader>

        {erreur && (
          <EmptyState style={{ marginBottom: 16, borderStyle: 'solid', borderColor: '#fca5a5' }}>
            <AlertCircle size={16} strokeWidth={2} /> {erreur}
          </EmptyState>
        )}

        {/* ===== Résultat final ===== */}
        {resultat ? (
          <>
            <EmptyState style={{ marginBottom: 20, borderStyle: 'solid', borderColor: '#bbf7d0' }}>
              <CheckCircle2 size={16} strokeWidth={2} /> {resultat.message}
            </EmptyState>

            {resultat.liens && (
              <CandidatureCard style={{ marginBottom: 20 }}>
                <OffreTitre>Liens d&apos;activation à transmettre</OffreTitre>
                <CardMeta style={{ marginTop: 8 }}>
                  <MetaItem>
                    <Info size={13} strokeWidth={2} />
                    Chaque lien est valable 24 heures et ne sert qu&apos;une fois.
                    L&apos;étudiant choisira lui-même son mot de passe.
                  </MetaItem>
                </CardMeta>
                <div style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto' }}>
                  {resultat.liens.map(l => (
                    <div key={l.email} style={{
                      padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12.5
                    }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{l.nom} — {l.email}</div>
                      <input readOnly value={l.lien} onFocus={(e) => e.target.select()}
                        style={{
                          width: '100%', marginTop: 4, padding: '6px 9px', fontSize: 11.5,
                          border: '1px solid #e2e8f0', borderRadius: 6, color: '#64748b'
                        }} />
                    </div>
                  ))}
                </div>
                <CardFooter>
                  <span />
                  <ActionButton onClick={() => {
                    const texte = resultat.liens.map(l => `${l.nom};${l.email};${l.lien}`).join('\r\n')
                    const blob = new Blob(['﻿' + 'nom;email;lien\r\n' + texte],
                      { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = 'liens-activation.csv'; a.click()
                    URL.revokeObjectURL(url)
                  }}>
                    <Download size={13} strokeWidth={2} /> Télécharger la liste
                  </ActionButton>
                </CardFooter>
              </CandidatureCard>
            )}

            <CardFooter style={{ borderTop: 'none' }}>
              <ActionButton onClick={() => { setResultat(null); setFichier(null) }}>
                <Upload size={13} strokeWidth={2} /> Importer un autre fichier
              </ActionButton>
              <ActionButton onClick={() => router.push('/pages/universiteEtudiant')}>
                Voir mes étudiants <ArrowRight size={13} strokeWidth={2.5} />
              </ActionButton>
            </CardFooter>
          </>

        ) : (
          <>
            {/* ===== Dépôt du fichier ===== */}
            <CandidatureCard style={{ marginBottom: 20 }}>
              <OffreTitre>1. Choisir le fichier</OffreTitre>
              <CardMeta style={{ marginTop: 12, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <input type="file" accept=".csv,text/csv" style={{ fontSize: 14 }}
                  onChange={(e) => choisirFichier(e.target.files?.[0] || null)} />
                <MetaItem>
                  <Info size={13} strokeWidth={2} />
                  Colonnes attendues : <strong>&nbsp;nom, prénom, email</strong>&nbsp;
                  (obligatoires), puis matricule, niveau, filière, spécialisation.
                  Les accents et les points-virgules d&apos;Excel sont reconnus.
                </MetaItem>
              </CardMeta>
              <CardFooter>
                <ActionButton type="button" onClick={telechargerModele}>
                  <Download size={13} strokeWidth={2} /> Télécharger un modèle
                </ActionButton>
                <ActionButton type="button" disabled={!fichier || enCours}
                  onClick={() => envoyer('analyse')}>
                  {enCours && !analyse ? 'Analyse...' : 'Analyser le fichier'}
                  <ArrowRight size={13} strokeWidth={2.5} />
                </ActionButton>
              </CardFooter>
            </CandidatureCard>

            {/* ===== Prévisualisation ===== */}
            {enCours && !analyse && <LoadingState>Lecture du fichier...</LoadingState>}

            {analyse && (
              <>
                <PageTitle style={{ fontSize: 19 }}>
                  <Users size={19} strokeWidth={2} /> 2. Vérifier avant d&apos;enregistrer
                </PageTitle>

                {analyse.erreurGlobale ? (
                  <EmptyState style={{ borderStyle: 'solid', borderColor: '#fca5a5' }}>
                    <AlertCircle size={16} strokeWidth={2} /> {analyse.erreurGlobale}
                  </EmptyState>
                ) : (
                  <>
                    <StatsRow>
                      <StatCard>
                        <StatValue>{stats.importables}</StatValue>
                        <StatLabel>Comptes à créer</StatLabel>
                      </StatCard>
                      <StatCard>
                        <StatValue>{stats.rejetees}</StatValue>
                        <StatLabel>Lignes rejetées</StatLabel>
                      </StatCard>
                      <StatCard>
                        <StatValue>{stats.dejaInscrits}</StatValue>
                        <StatLabel>Déjà inscrits</StatLabel>
                      </StatCard>
                      <StatCard>
                        <StatValue>{stats.avecAvertissement}</StatValue>
                        <StatLabel>À vérifier</StatLabel>
                      </StatCard>
                    </StatsRow>

                    <CandidatureCard style={{ marginBottom: 20 }}>
                      <CardMeta style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                        <MetaItem>
                          Fichier lu avec le séparateur
                          <strong>&nbsp;« {analyse.separateur === '\t' ? 'tabulation' : analyse.separateur} »</strong>,
                          {' '}{stats.total} ligne{stats.total > 1 ? 's' : ''} de données.
                        </MetaItem>
                        {stats.doublonsFichier > 0 && (
                          <MetaItem style={{ color: '#b45309' }}>
                            <TriangleAlert size={13} strokeWidth={2} />
                            {stats.doublonsFichier} adresse{stats.doublonsFichier > 1 ? 's apparaissent' : ' apparaît'} plusieurs fois dans le fichier.
                          </MetaItem>
                        )}
                        {(stats.sansNiveau > 0 || stats.sansFiliere > 0) && (
                          <MetaItem>
                            <Info size={13} strokeWidth={2} />
                            {stats.sansNiveau} sans niveau, {stats.sansFiliere} sans filière —
                            ces comptes seront créés, les étudiants compléteront eux-mêmes.
                          </MetaItem>
                        )}
                      </CardMeta>

                      {/* Le détail montre d'abord ce qui pose problème :
                          une liste de 300 lignes correctes n'apprend rien,
                          les 11 lignes fautives sont ce qu'on vient voir. */}
                      {affichees.length > 0 && (
                        <div style={{ marginTop: 14, maxHeight: 380, overflowY: 'auto' }}>
                          {affichees.map(l => (
                            <div key={l.ligne} style={{
                              display: 'flex', gap: 10, alignItems: 'flex-start',
                              padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12.5
                            }}>
                              <span style={{
                                minWidth: 42, color: '#94a3b8', fontVariantNumeric: 'tabular-nums'
                              }}>L{l.ligne}</span>
                              <span style={{ flexShrink: 0, marginTop: 1 }}>
                                {l.importable
                                  ? <TriangleAlert size={13} strokeWidth={2} color="#d97706" />
                                  : <AlertCircle size={13} strokeWidth={2} color="#dc2626" />}
                              </span>
                              <span style={{ minWidth: 0, flex: 1 }}>
                                <strong style={{ color: '#334155' }}>
                                  {l.prenom} {l.nom}
                                </strong>
                                <span style={{ color: '#94a3b8' }}> — {l.email || 'sans adresse'}</span>
                                <div style={{ color: l.importable ? '#b45309' : '#b91c1c', marginTop: 2 }}>
                                  {[...l.erreurs, ...l.avertissements].join(' · ')}
                                </div>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {aProbleme.length === 0 && (
                        <CardMeta style={{ marginTop: 12 }}>
                          <MetaItem style={{ color: '#15803d' }}>
                            <CheckCircle2 size={13} strokeWidth={2} />
                            Aucune anomalie : les {stats.importables} lignes sont prêtes.
                          </MetaItem>
                        </CardMeta>
                      )}

                      {lignes.length > affichees.length && (
                        <CardMeta style={{ marginTop: 10 }}>
                          <ActionButton type="button" onClick={() => setToutAfficher(!toutAfficher)}>
                            {toutAfficher
                              ? 'Ne montrer que les anomalies'
                              : `Afficher les ${lignes.length} lignes`}
                          </ActionButton>
                        </CardMeta>
                      )}

                      {/* La promotion n'est demandée qu'ICI, une fois le
                          fichier vérifié : l'université doit pouvoir
                          regarder son contenu avant de décider comment le
                          nommer. */}
                      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        <OffreTitre style={{ fontSize: 15 }}>3. Nommer la promotion</OffreTitre>
                        <CardMeta style={{ marginTop: 6 }}>
                          <MetaItem>
                            <Info size={13} strokeWidth={2} />
                            Ces {stats.importables} étudiants formeront un groupe que vous
                            pourrez ensuite gérer d&apos;un seul geste.
                          </MetaItem>
                        </CardMeta>
                        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                          <input
                            value={promotion}
                            onChange={(e) => setPromotion(e.target.value)}
                            placeholder="Nom de la promotion, ex. « L3 Informatique »"
                            maxLength={120}
                            style={{ flex: '1 1 240px', padding: '10px 13px', fontSize: 14,
                                     border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                          />
                          <select
                            value={annee}
                            onChange={(e) => setAnnee(e.target.value)}
                            style={{ flex: '0 1 160px', padding: '10px 13px', fontSize: 14,
                                     border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                          >
                            {anneesProposees().map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                      </div>

                      <CardFooter>
                        <ActionButton type="button" onClick={() => setAnalyse(null)}>
                          <ArrowLeft size={13} strokeWidth={2} /> Changer de fichier
                        </ActionButton>
                        <ActionButton type="button"
                          disabled={enCours || stats.importables === 0 || !promotion.trim()}
                          onClick={() => envoyer('confirmation')}>
                          {enCours
                            ? 'Création en cours...'
                            : `Créer les ${stats.importables} comptes`}
                          {!enCours && <ArrowRight size={13} strokeWidth={2.5} />}
                        </ActionButton>
                      </CardFooter>
                    </CandidatureCard>
                  </>
                )}
              </>
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
