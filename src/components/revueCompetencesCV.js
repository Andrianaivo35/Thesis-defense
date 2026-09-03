'use client'
import { useState } from 'react'
import {
  Sparkles, ScanLine, FileType2, Check, X, Info, AlertCircle
} from 'lucide-react'
import {
  CandidatureCard, OffreTitre, EntrepriseNom,
  CardMeta, MetaItem, CardFooter, ActionButton, StatutBadge
} from '@/components/styleEtudiantCandidature'

/* =====================================================================
   REVUE DES COMPÉTENCES DÉTECTÉES DANS UN CV

   L'écran qui matérialise le principe : le pipeline PROPOSE, l'étudiant
   DISPOSE.

   Ni l'OCR ni l'extraction ne seront fiables à 100 %. Écrire d'office
   les compétences détectées dans le profil ferait d'une erreur de
   lecture une donnée fausse, propagée ensuite dans toutes les
   recommandations sans que personne ne puisse remonter à sa cause.

   Présenter les détections à confirmer transforme cette erreur en une
   case à décocher. C'est aussi, du point de vue de l'étudiant, un
   formulaire PRÉ-REMPLI au lieu d'un formulaire vide : le travail est
   fait, il ne reste qu'à le vérifier.

   Chaque proposition affiche D'OÙ elle vient — la page, la section, la
   ligne d'origine. Sans cette justification, l'étudiant n'aurait aucun
   moyen de trancher autrement qu'au hasard.
   ===================================================================== */

const LIBELLES_SECTION = {
  competences: 'Compétences',
  logiciels: 'Logiciels',
  experiences: 'Expériences',
  formation: 'Formation',
  langues: 'Langues',
  certifications: 'Certifications',
  loisirs: 'Centres d’intérêt',
  qualites: 'Qualités',
  divers: 'Divers',
  'sans section': 'Hors section'
}

function libelleVoie(cv) {
  const pages = Number(cv.nombrePages) || 0
  const ocr = Number(cv.pagesOcr) || 0
  if (ocr === 0) return { texte: 'Document numérique, texte lu directement', icone: FileType2 }
  if (ocr === pages) return { texte: `Document numérisé, ${ocr} page${ocr > 1 ? 's' : ''} déchiffrée${ocr > 1 ? 's' : ''} par reconnaissance de caractères`, icone: ScanLine }
  return {
    texte: `Document mixte : ${pages - ocr} page${pages - ocr > 1 ? 's' : ''} lue${pages - ocr > 1 ? 's' : ''} directement, ${ocr} déchiffrée${ocr > 1 ? 's' : ''} par reconnaissance de caractères`,
    icone: ScanLine
  }
}

export default function RevueCompetencesCV({ cv, detections, onEnregistrer, onFermer }) {
  /* Les détections au-dessus du seuil sont cochées d'avance ; les autres
     restent visibles mais décochées. Rien n'est caché : une compétence
     réellement présente mais lue dans une section secondaire doit rester
     rattrapable par l'étudiant. */
  const [retenues, setRetenues] = useState(
    () => new Set(detections.filter(d => d.proposee).map(d => d.idCompetenceReference))
  )
  const [enCours, setEnCours] = useState(false)

  const basculer = (id) => {
    setRetenues(prev => {
      const suivant = new Set(prev)
      if (suivant.has(id)) suivant.delete(id); else suivant.add(id)
      return suivant
    })
  }

  const enregistrer = async () => {
    setEnCours(true)
    try { await onEnregistrer([...retenues]) } finally { setEnCours(false) }
  }

  const voie = libelleVoie(cv)
  const Icone = voie.icone
  const sures = detections.filter(d => d.proposee)
  const incertaines = detections.filter(d => !d.proposee)

  return (
    <CandidatureCard style={{ marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#A98B76' }}>
      <OffreTitre>
        <Sparkles size={16} strokeWidth={2.5} style={{ verticalAlign: -2, marginRight: 6 }} />
        Compétences trouvées dans « {cv.libelle} »
      </OffreTitre>

      <CardMeta style={{ marginTop: 8 }}>
        <MetaItem>
          <Icone size={13} strokeWidth={2} />
          {voie.texte}
        </MetaItem>
        {cv.confianceOcr !== null && cv.confianceOcr !== undefined && (
          <MetaItem>Fiabilité de la lecture : {Number(cv.confianceOcr).toFixed(0)} %</MetaItem>
        )}
      </CardMeta>

      {detections.length === 0 ? (
        <CardMeta style={{ marginTop: 14 }}>
          <MetaItem>
            <AlertCircle size={13} strokeWidth={2} />
            Aucune compétence de notre référentiel n&apos;a été reconnue dans ce
            document. Vous pouvez les ajouter vous-même depuis votre profil.
          </MetaItem>
        </CardMeta>
      ) : (
        <>
          <EntrepriseNom style={{ marginTop: 16, marginBottom: 8 }}>
            Vérifiez et corrigez avant d&apos;ajouter à votre profil
          </EntrepriseNom>

          <ListeDetections
            detections={sures}
            retenues={retenues}
            basculer={basculer}
          />

          {incertaines.length > 0 && (
            <>
              <CardMeta style={{ marginTop: 18, marginBottom: 4 }}>
                <MetaItem style={{ fontWeight: 600, color: '#475569' }}>
                  <Info size={13} strokeWidth={2} />
                  Lues ailleurs que dans une rubrique de compétences — à
                  cocher seulement si elles vous correspondent
                </MetaItem>
              </CardMeta>
              <ListeDetections
                detections={incertaines}
                retenues={retenues}
                basculer={basculer}
              />
            </>
          )}
        </>
      )}

      <CardFooter>
        <MetaItem>
          {retenues.size} compétence{retenues.size > 1 ? 's' : ''} retenue{retenues.size > 1 ? 's' : ''}
          {' sur '}{detections.length} proposée{detections.length > 1 ? 's' : ''}
        </MetaItem>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionButton onClick={onFermer} disabled={enCours}>
            <X size={13} strokeWidth={2} /> Fermer
          </ActionButton>
          {detections.length > 0 && (
            <ActionButton onClick={enregistrer} disabled={enCours}>
              <Check size={13} strokeWidth={2} />
              {enCours ? 'Enregistrement...' : 'Ajouter à mon profil'}
            </ActionButton>
          )}
        </div>
      </CardFooter>
    </CandidatureCard>
  )
}

function ListeDetections({ detections, retenues, basculer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {detections.map(d => {
        const coche = retenues.has(d.idCompetenceReference)
        return (
          <label
            key={d.idCompetenceDetectee}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              border: `1.5px solid ${coche ? '#d6dcb3' : '#e2e8f0'}`,
              background: coche ? '#f5f3eb' : '#fff'
            }}
          >
            <input
              type="checkbox"
              checked={coche}
              onChange={() => basculer(d.idCompetenceReference)}
              style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14, color: '#1e293b' }}>{d.nom}</strong>
                {d.categorie && (
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>{d.categorie}</span>
                )}
                {d.dejaAuProfil && (
                  <StatutBadge $statut="Recruté" style={{ fontSize: 10.5 }}>
                    Déjà à votre profil
                  </StatutBadge>
                )}
              </div>

              {/* La justification. Sans elle, l'étudiant n'aurait aucun
                  moyen de trancher : « pourquoi me propose-t-on cela ? » */}
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                {d.methode === 'floue' && (
                  <>Lu « {d.termeDetecte} » — orthographe approchante. </>
                )}
                {LIBELLES_SECTION[d.section] || d.section}
                {d.page ? `, page ${d.page}` : ''}
              </div>

              {d.contexte && (
                <div style={{
                  fontSize: 11.5, color: '#94a3b8', marginTop: 4,
                  fontStyle: 'italic', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  « {d.contexte} »
                </div>
              )}
            </div>
          </label>
        )
      })}
    </div>
  )
}
