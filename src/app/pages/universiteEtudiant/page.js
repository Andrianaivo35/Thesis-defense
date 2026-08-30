'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import { GraduationCap, UserMinus, MessageSquare } from 'lucide-react'
import {
  PageContainer, HeaderSection, SearchBar, FiltersBar, FilterLabel, FilterSelect,
  PageTitle,
  StatsRow, StatCard, StatValue, StatLabel,
  EtudiantsGrid, EtudiantCard, EtudiantAvatar,
  EtudiantHeader, EtudiantName, EtudiantLevel,
  EtudiantInfo, EtudiantInfoItem,
  StageTag, NoStageTag,
  EtudiantFooter, ViewProfileButton,
  EmptyState, LoadingState,
  BoutonPromotion, ActionButton, ContactButton
} from '@/components/styleUniversiteEtudiants'

export default function UniversiteEtudiants() {
  const router = useRouter()
  const [etudiants, setEtudiants] = useState([])
  const [demandes, setDemandes] = useState([])
  const [traitementEnCours, setTraitementEnCours] = useState(null)
  const [messageDemande, setMessageDemande] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('all')
  const [promotions, setPromotions] = useState([])
  const [sansPromotion, setSansPromotion] = useState(0)
  const [filtrePromotion, setFiltrePromotion] = useState('all')
  const [voirAnciens, setVoirAnciens] = useState(false)
  const [cloture, setCloture] = useState(null)   // { statut, apercu, motif }
  const [clotureEnCours, setClotureEnCours] = useState(false)

  const chargerEtudiants = async () => {
    try {
      /* Les promotions sont chargées en parallèle : l'écran s'organise
         autour d'elles, il ne doit pas attendre deux allers-retours. */
      fetchAuth('/api/universitePromotions')
        .then(r => r.json())
        .then(d => { setPromotions(d.promotions || []); setSansPromotion(d.sansPromotion || 0) })
        .catch(() => {})

      const res = await fetchAuth('/api/universiteEtudiant')
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error)
      setEtudiants(data.etudiants || [])
      setDemandes(data.demandesRattachement || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    chargerEtudiants()
  }, [])

  // Valider ou refuser une demande de rattachement
  const traiterDemande = async (idEtudiant, decision) => {
    setTraitementEnCours(idEtudiant)
    setMessageDemande('')
    try {
      const res = await fetchAuth('/api/universiteEtudiant', {
        method: 'PATCH',
        body: JSON.stringify({ idEtudiant, decision })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors du traitement')
      setMessageDemande(data.message)
      await chargerEtudiants()
    } catch (err) {
      setMessageDemande(err.message)
    } finally {
      setTraitementEnCours(null)
    }
  }

  /* On simule avant d'agir : une action portant sur quatre-vingts
     personnes doit se voir avant de se lancer. Même raisonnement que la
     prévisualisation de l'import. */
  const preparerCloture = async (statut) => {
    setMessageDemande('')
    try {
      const res = await fetchAuth('/api/universiteCycleVie', {
        method: 'POST',
        body: JSON.stringify({
          statut, simulation: true,
          idPromotion: filtrePromotion !== 'all' && filtrePromotion !== 'aucune'
            ? filtrePromotion : null,
          idsEtudiants: filtrePromotion === 'aucune'
            ? etudiantsFiltres.map(e => e.idEtudiant) : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCloture({ statut, apercu: data, exclusions: [], motif: '' })
    } catch (err) { setMessageDemande(err.message) }
  }

  const confirmerCloture = async () => {
    setClotureEnCours(true)
    try {
      const res = await fetchAuth('/api/universiteCycleVie', {
        method: 'POST',
        body: JSON.stringify({
          statut: cloture.statut,
          idPromotion: filtrePromotion !== 'all' && filtrePromotion !== 'aucune'
            ? filtrePromotion : null,
          idsEtudiants: filtrePromotion === 'aucune'
            ? cloture.apercu.concernes.map(c => c.idEtudiant) : null,
          exclusions: cloture.exclusions,
          motif: cloture.motif
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessageDemande(data.message)
      setCloture(null)
      await chargerEtudiants()
    } catch (err) { setMessageDemande(err.message) }
    finally { setClotureEnCours(false) }
  }

  const basculerExclusion = (id) => {
    setCloture(c => ({
      ...c,
      exclusions: c.exclusions.includes(id)
        ? c.exclusions.filter(x => x !== id)
        : [...c.exclusions, id]
    }))
  }

  const niveauxList = useMemo(() => {
    const set = new Set()
    etudiants.forEach(e => e.niveauAcademique && set.add(e.niveauAcademique))
    return Array.from(set).sort()
  }, [etudiants])

  /* Actifs et anciens viennent de la même requête, mais ne se mélangent
     pas à l'écran : une université cherche ses étudiants de l'année, pas
     un annuaire cumulé depuis quatre ans. */
  const actifs = useMemo(
    () => etudiants.filter(e => (e.statutRattachement || 'Valide') === 'Valide'),
    [etudiants])
  const anciens = useMemo(
    () => etudiants.filter(e => ['Diplome', 'Sorti'].includes(e.statutRattachement)),
    [etudiants])

  const etudiantsFiltres = useMemo(() => {
    let filtered = voirAnciens ? anciens : actifs

    /* « aucune » vise les étudiants rattachés à l'établissement mais à
       aucun groupe : inscrits d'eux-mêmes, ou importés avant l'existence
       des promotions. Sans ce cas, ils disparaîtraient de l'écran. */
    if (filtrePromotion === 'aucune') {
      filtered = filtered.filter(e => !e.idPromotion)
    } else if (filtrePromotion !== 'all') {
      filtered = filtered.filter(e => String(e.idPromotion) === String(filtrePromotion))
    }

    if (filterNiveau !== 'all') {
      filtered = filtered.filter(e => e.niveauAcademique === filterNiveau)
    }

    const search = searchTerm.toLowerCase().trim()
    if (search) {
      filtered = filtered.filter(e =>
        e.nomEtudiant?.toLowerCase().includes(search) ||
        e.prenomEtudiant?.toLowerCase().includes(search) ||
        e.filiere?.toLowerCase().includes(search) ||
        e.specialisation?.toLowerCase().includes(search) ||
        e.emailUtilisateur?.toLowerCase().includes(search)
      )
    }

    return filtered
  /* Toutes les entrees dont le calcul depend, sans exception : la liste
     ne se rafraichissait pas au basculement actifs/anciens ni au
     changement de promotion, parce que ces deux etats manquaient ici. */
  }, [actifs, anciens, voirAnciens, filtrePromotion, searchTerm, filterNiveau])

  // Statistiques
  const stats = useMemo(() => ({
    total: etudiants.length,
    enStage: etudiants.filter(e => e.stageEntreprise).length,
    actifs: etudiants.filter(e => e.estActif).length
  }), [etudiants])

  const handleVoirProfil = (idEtudiant) => {
    router.push(`/pages/etudiantProfil/${idEtudiant}`)
  }

  return (
    <>
      {/* La page n'avait AUCUNE barre de navigation : une université qui
          y arrivait ne pouvait plus rejoindre son tableau de bord, ni
          ses annonces, ni se déconnecter, sans revenir en arrière dans
          le navigateur. */}
      <AppNavbar />
      <PageContainer>
      <HeaderSection>
        <SearchBar
          type="text"
          placeholder="🔍 Rechercher un étudiant par nom, filière, spécialisation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FiltersBar>
          <FilterLabel>Niveau académique :</FilterLabel>
          <FilterSelect value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
            <option value="all">Tous les niveaux</option>
            {niveauxList.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </FilterSelect>
        </FiltersBar>
      </HeaderSection>

      {/* === Statistiques === */}
      <StatsRow>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Étudiants inscrits</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.enStage}</StatValue>
          <StatLabel>En stage</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.actifs}</StatValue>
          <StatLabel>Comptes actifs</StatLabel>
        </StatCard>
      </StatsRow>

      {/* === Demandes de rattachement en attente ===
          Des étudiants se sont déclarés membres de cet établissement.
          C'est à l'université de confirmer : elle seule sait qui sont
          réellement ses étudiants. */}
      {!isLoading && demandes.length > 0 && (
        <>
          <PageTitle>
            Demandes de rattachement en attente ({demandes.length})
          </PageTitle>
          {messageDemande && <EmptyState>{messageDemande}</EmptyState>}
          <EtudiantsGrid>
            {demandes.map((d) => (
              <EtudiantCard key={d.idEtudiant}>
                <EtudiantHeader>
                  <EtudiantAvatar>
                    {d.photoProfil
                      ? <img src={d.photoProfil} alt="" />
                      : `${(d.prenomEtudiant || '?')[0]}${(d.nomEtudiant || '?')[0]}`}
                  </EtudiantAvatar>
                  <div>
                    <EtudiantName>{d.prenomEtudiant} {d.nomEtudiant}</EtudiantName>
                    <EtudiantLevel>{d.niveauAcademique || 'Niveau non précisé'}</EtudiantLevel>
                  </div>
                </EtudiantHeader>

                <EtudiantInfo>
                  <EtudiantInfoItem>Filière : {d.filiere || 'Non précisée'}</EtudiantInfoItem>
                  <EtudiantInfoItem>Spécialisation : {d.specialisation || 'Non précisée'}</EtudiantInfoItem>
                  <EtudiantInfoItem>Matricule : {d.matricule || 'Non précisé'}</EtudiantInfoItem>
                  <EtudiantInfoItem>{d.emailUtilisateur}</EtudiantInfoItem>
                </EtudiantInfo>

                <EtudiantFooter>
                  <ViewProfileButton
                    onClick={() => traiterDemande(d.idEtudiant, 'Valide')}
                    disabled={traitementEnCours === d.idEtudiant}
                  >
                    {traitementEnCours === d.idEtudiant ? 'Traitement...' : 'Valider'}
                  </ViewProfileButton>
                  <ViewProfileButton
                    onClick={() => traiterDemande(d.idEtudiant, 'Refuse')}
                    disabled={traitementEnCours === d.idEtudiant}
                  >
                    Refuser
                  </ViewProfileButton>
                </EtudiantFooter>
              </EtudiantCard>
            ))}
          </EtudiantsGrid>
        </>
      )}

      {/* ===== Les promotions, unité de gestion de l'établissement =====

          Une université raisonne en promotions, pas en individus. Une
          liste de plusieurs centaines de noms ne se pilote pas ; quelques
          groupes, si. */}
      {(promotions.length > 0 || sansPromotion > 0) && (
        <>
          <PageTitle style={{ fontSize: 19 }}>Mes promotions</PageTitle>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <BoutonPromotion $actif={filtrePromotion === 'all'}
              onClick={() => setFiltrePromotion('all')}>
              <strong>Toutes</strong>
              <span>{etudiants.length} étudiants</span>
            </BoutonPromotion>

            {promotions.map(p => (
              <BoutonPromotion key={p.idPromotion}
                $actif={String(filtrePromotion) === String(p.idPromotion)}
                onClick={() => setFiltrePromotion(p.idPromotion)}>
                <strong>{p.libelle}</strong>
                <span>{p.annee} · {p.effectif} étudiant{p.effectif > 1 ? 's' : ''}</span>
                {p.enAttenteActivation > 0 && (
                  <span style={{ color: '#b45309' }}>
                    {p.enAttenteActivation} compte{p.enAttenteActivation > 1 ? 's' : ''} à activer
                  </span>
                )}
                {p.enStage > 0 && (
                  <span style={{ color: '#15803d' }}>{p.enStage} en stage</span>
                )}
              </BoutonPromotion>
            ))}

            {sansPromotion > 0 && (
              <BoutonPromotion $actif={filtrePromotion === 'aucune'}
                onClick={() => setFiltrePromotion('aucune')}>
                <strong>Sans promotion</strong>
                <span>{sansPromotion} étudiant{sansPromotion > 1 ? 's' : ''}</span>
              </BoutonPromotion>
            )}
          </div>
        </>
      )}

      {/* ===== Bascule actifs / anciens et actions de fin de cursus ===== */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
                    marginBottom: 14 }}>
        <BoutonPromotion $actif={!voirAnciens} onClick={() => setVoirAnciens(false)}
          style={{ minWidth: 0, padding: '9px 14px' }}>
          <strong>Étudiants actifs</strong>
          <span>{actifs.length}</span>
        </BoutonPromotion>
        <BoutonPromotion $actif={voirAnciens} onClick={() => setVoirAnciens(true)}
          style={{ minWidth: 0, padding: '9px 14px' }}>
          <strong>Anciens</strong>
          <span>{anciens.length} diplômés ou sortis</span>
        </BoutonPromotion>

        {/* Les actions de fin de cursus ne s'offrent que sur les actifs,
            et seulement quand une promotion est sélectionnée : c'est
            l'unité de gestion, et l'appliquer à « toutes » serait
            presque toujours une erreur. */}
        {!voirAnciens && filtrePromotion !== 'all' && etudiantsFiltres.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <ActionButton type="button" onClick={() => preparerCloture('Diplome')}>
              <GraduationCap size={13} strokeWidth={2} /> Déclarer diplômés
            </ActionButton>
            <ActionButton type="button" onClick={() => preparerCloture('Sorti')}>
              <UserMinus size={13} strokeWidth={2} /> Retirer des effectifs
            </ActionButton>
          </div>
        )}
      </div>

      {/* ===== Confirmation, avec exclusion nominative ===== */}
      {cloture && (
        <EmptyState style={{ marginBottom: 18, borderStyle: 'solid',
                             borderColor: '#c4b5fd', textAlign: 'left' }}>
          <p style={{ fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
            {cloture.statut === 'Diplome'
              ? `Déclarer ${cloture.apercu.total - cloture.exclusions.length} étudiants diplômés`
              : `Retirer ${cloture.apercu.total - cloture.exclusions.length} étudiants des effectifs`}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>
            {cloture.statut === 'Diplome'
              ? "Ils restent sur la plateforme en « ancien étudiant » et continuent de recevoir des recommandations."
              : "Leur rattachement prend fin. Leur compte reste actif et ils pourront rattacher un autre établissement."}
            {' '}Décochez ceux qui ne sont pas concernés — un redoublant, par exemple.
          </p>

          <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
            {cloture.apercu.concernes.map(c => (
              <label key={c.idEtudiant} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0',
                fontSize: 13, cursor: 'pointer',
                opacity: cloture.exclusions.includes(c.idEtudiant) ? 0.45 : 1
              }}>
                <input type="checkbox"
                  checked={!cloture.exclusions.includes(c.idEtudiant)}
                  onChange={() => basculerExclusion(c.idEtudiant)}
                  style={{ width: 15, height: 15, cursor: 'pointer' }} />
                {c.nom}
              </label>
            ))}
          </div>

          {cloture.statut === 'Sorti' && (
            <input
              value={cloture.motif}
              onChange={(e) => setCloture(c => ({ ...c, motif: e.target.value }))}
              placeholder="Motif (facultatif) : abandon, transfert, exclusion…"
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, marginBottom: 12,
                       border: '1.5px solid #e2e8f0', borderRadius: 8 }} />
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionButton type="button" onClick={() => setCloture(null)}>Annuler</ActionButton>
            <ActionButton type="button" onClick={confirmerCloture}
              disabled={clotureEnCours || cloture.apercu.total === cloture.exclusions.length}>
              {clotureEnCours ? 'Enregistrement...' : 'Confirmer'}
            </ActionButton>
          </div>
        </EmptyState>
      )}

      <PageTitle>{voirAnciens ? 'Anciens étudiants' : 'Mes étudiants'} ({etudiantsFiltres.length})</PageTitle>

      {isLoading ? (
        <LoadingState>Chargement des étudiants...</LoadingState>
      ) : etudiantsFiltres.length === 0 ? (
        <EmptyState>
          {searchTerm || filterNiveau !== 'all'
            ? 'Aucun étudiant ne correspond à vos critères.'
            : 'Aucun étudiant inscrit pour le moment.'}
        </EmptyState>
      ) : (
        <EtudiantsGrid>
          {etudiantsFiltres.map((e) => (
            <EtudiantCard
              key={e.idEtudiant}
              onClick={() => handleVoirProfil(e.idEtudiant)}
            >
              <EtudiantAvatar>
                {e.photoProfil ? (
                  <img src={e.photoProfil} alt={e.prenomEtudiant} />
                ) : (
                  (e.prenomEtudiant?.charAt(0) || '') + (e.nomEtudiant?.charAt(0) || '')
                )}
              </EtudiantAvatar>

              <EtudiantHeader>
                <EtudiantName>{e.prenomEtudiant} {e.nomEtudiant}</EtudiantName>
                {e.niveauAcademique && <EtudiantLevel>{e.niveauAcademique}</EtudiantLevel>}
              </EtudiantHeader>

              <EtudiantInfo>
                {e.filiere && <EtudiantInfoItem>📚 {e.filiere}</EtudiantInfoItem>}
                {e.specialisation && <EtudiantInfoItem>🎯 {e.specialisation}</EtudiantInfoItem>}
                <EtudiantInfoItem>📋 {e.nombreCandidatures || 0} candidature(s)</EtudiantInfoItem>
              </EtudiantInfo>

              {/* Statut de stage */}
              {e.stageEntreprise ? (
                <StageTag>
                  🎉 En stage : {e.stagePoste} chez <strong>{e.stageEntreprise}</strong>
                </StageTag>
              ) : (
                <NoStageTag>Pas encore en stage</NoStageTag>
              )}

              {/* La carte n'offrait qu'un lien passif : une université
                  pouvait consulter ses étudiants, jamais agir. Contacter
                  est l'action la plus évidemment attendue, et la
                  messagerie existe déjà.

                  stopPropagation : la carte entière ouvre le profil ;
                  sans cela, le clic sur « Contacter » déclencherait les
                  deux. */}
              <EtudiantFooter>
                <ViewProfileButton>Voir le profil →</ViewProfileButton>
                {e.idUtilisateur && (
                  <ContactButton
                    onClick={(ev) => {
                      ev.stopPropagation()
                      router.push(`/pages/messages?destinataire=${e.idUtilisateur}`)
                    }}
                  >
                    <MessageSquare size={13} strokeWidth={2} /> Contacter
                  </ContactButton>
                )}
              </EtudiantFooter>
            </EtudiantCard>
          ))}
        </EtudiantsGrid>
      )}
      </PageContainer>
    </>
  )
}