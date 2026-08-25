'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, GraduationCap, MapPin, Target, Briefcase, Heart, Wrench,
  Plus, Trash2, Info, Check, Sparkles,
  AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Save
} from 'lucide-react'
import {
  PageContainer,
  ContainerForm,
  FormHeader, FormBadge, FormTitle, FormSubtitle,
  StepIndicator, Step, StepNumber, StepLabel, StepLine,
  FormGrid,
  ColumnForm,
  SectionTitle,
  Label,
  Input,
  Select,
  TextArea,
  HelperText,
  ContainerLabelInput,
  ItemCard, ItemHeader, ItemBadge, DeleteItemButton, AddItemButton,
  ContainerButtons,
  Button,
  AlertMessage
} from '@/components/styleEtudiantRegistreInfo'

const ETAPES = ['Profil', 'Préférences', 'Parcours']
const NIVEAUX_COMPETENCE = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert']

export default function EtudiantRegistreInfo() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [universites, setUniversites] = useState([])
  const [isLoadingUniversites, setIsLoadingUniversites] = useState(true)

  // référentiel des compétences proposées dans la liste déroulante
  const [referentiel, setReferentiel] = useState([])

  useEffect(() => {
    const fetchUniversites = async () => {
      try {
        const res = await fetch('/api/universiteList')
        const data = await res.json()
        if (!res.ok) throw new Error(data.details || data.error)
        setUniversites(data.universites || [])
      } catch (err) {
        // Pas bloquant : la liste sert juste de suggestion
        console.warn('Universités non chargées :', err.message)
      } finally {
        setIsLoadingUniversites(false)
      }
    }
    fetchUniversites()
  }, [])

  useEffect(() => {
    const fetchReferentiel = async () => {
      try {
        const res = await fetch('/api/competenceReference')
        const data = await res.json()
        if (res.ok) setReferentiel(data.competences || [])
      } catch (err) {
        console.warn('Référentiel de compétences non chargé :', err.message)
      }
    }
    fetchReferentiel()
  }, [])

  // === Informations personnelles ===
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [adresse, setAdresse] = useState('')
  const [telephone, setTelephone] = useState('')
  const [sexe, setSexe] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [matricule, setMatricule] = useState('')

  // === Informations académiques ===
  const [niveauAcademique, setNiveauAcademique] = useState('')
  const [specialisation, setSpecialisation] = useState('')
  const [universite, setUniversite] = useState('')  // contient le NOM saisi
  const [filiere, setFiliere] = useState('')

  // === Préférences localisation / stage ===
  const [ville, setVille] = useState('')
  const [rayonDeplacement, setRayonDeplacement] = useState('')
  const [accepteTeletravail, setAccepteTeletravail] = useState('')
  const [mobiliteNational, setMobiliteNational] = useState('')
  const [typeStagePreferee, setTypeStagePreferee] = useState('')
  const [typeEntreprisePreferee, setTypeEntreprisePreferee] = useState('')
  const [disponibiliteImmediate, setDisponibiliteImmediate] = useState('')
  const [dureeSouhaitee, setDureeSouhaitee] = useState('')
  const [dateDebutDisponibilite, setDateDebutDisponibilite] = useState('')
  const [dateFinDisponibilite, setDateFinDisponibilite] = useState('')

  // === Compétences ===
  const [competences, setCompetences] = useState([])

  const [experiences, setExperiences] = useState([
    { titrePoste: '', description: '', dateDebut: '', dateFin: '', type: '', entreprise: '', lien: '' }
  ])
  const [centresInteret, setCentresInteret] = useState([
    { domaine: '', mission: '' }
  ])

  /* ---------- Compétences ---------- */
  const ajouterCompetence = () => {
    setCompetences([...competences, { idCompetenceReference: '', niveau: 'Débutant' }])
  }
  const supprimerCompetence = (index) => {
    setCompetences(competences.filter((_, i) => i !== index))
  }
  const modifierCompetence = (index, champ, valeur) => {
    const nouvelles = [...competences]
    nouvelles[index][champ] = valeur
    setCompetences(nouvelles)
  }

  /* Retire des listes déroulantes les compétences déjà choisies ailleurs */
  const referentielDisponible = (idxCourant) => {
    const dejaChoisies = competences
      .filter((_, i) => i !== idxCourant)
      .map(c => String(c.idCompetenceReference))
    return referentiel.filter(r => !dejaChoisies.includes(String(r.idCompetenceReference)))
  }

  /* ---------- Expériences ---------- */
  const ajouterExperience = () => {
    setExperiences([...experiences, { titrePoste: '', description: '', dateDebut: '', dateFin: '', type: '', entreprise: '', lien: '' }])
  }
  const supprimerExperience = (index) => {
    if (experiences.length > 1) setExperiences(experiences.filter((_, i) => i !== index))
  }
  const modifierExperience = (index, champ, valeur) => {
    const nouvelles = [...experiences]
    nouvelles[index][champ] = valeur
    setExperiences(nouvelles)
  }

  /* ---------- Centres d'intérêt ---------- */
  const ajouterCentreInteret = () => {
    setCentresInteret([...centresInteret, { domaine: '', mission: '' }])
  }
  const supprimerCentreInteret = (index) => {
    if (centresInteret.length > 1) setCentresInteret(centresInteret.filter((_, i) => i !== index))
  }
  const modifierCentreInteret = (index, champ, valeur) => {
    const nouvelles = [...centresInteret]
    nouvelles[index][champ] = valeur
    setCentresInteret(nouvelles)
  }

  const handleNext = () => {
    setError('')
    setCurrentStep(prev => prev + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handlePrevious = () => {
    setError('')
    setCurrentStep(prev => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const experiencesValides = experiences.filter(exp => exp.titrePoste?.trim())
      const centresValides = centresInteret.filter(c => c.domaine?.trim())
      const competencesValides = competences.filter(c => c.idCompetenceReference)

      const res = await fetch('/api/etudiantRegistreInfo', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          nom, prenom, email, adresse, telephone, sexe, motDePasse, matricule,
          niveauAcademique, specialisation,
          nomUniversite: universite,
          filiere, ville, rayonDeplacement, accepteTeletravail,
          mobiliteNational, typeStagePreferee, typeEntreprisePreferee,
          dureeSouhaitee, dateDebutDisponibilite, dateFinDisponibilite,
          disponibiliteImmediate,
          experiences: experiencesValides,
          centresInteret: centresValides,
          competences: competencesValides
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || `Erreur ${res.status}`)

      setSuccess(data.message || 'Inscription réussie ! Redirection en cours...')
      setTimeout(() => router.push('/pages/etudiantLogin'), 2500)

    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <ContainerForm>
        <FormHeader>
          <FormBadge>Espace Étudiant</FormBadge>
          <FormTitle>Créer mon compte</FormTitle>
          <FormSubtitle>
            Trois étapes suffisent pour rejoindre Stage Share et commencer à postuler.
          </FormSubtitle>
        </FormHeader>

        {/* ===== Indicateur d'étapes ===== */}
        <StepIndicator>
          {ETAPES.map((label, i) => {
            const numero = i + 1
            const actif = currentStep >= numero
            return (
              <div key={label} style={{ display: 'contents' }}>
                {i > 0 && <StepLine $active={currentStep >= numero} />}
                <Step>
                  <StepNumber $active={actif}>
                    {currentStep > numero
                      ? <Check size={18} strokeWidth={3} />
                      : numero}
                  </StepNumber>
                  <StepLabel $active={actif}>{label}</StepLabel>
                </Step>
              </div>
            )
          })}
        </StepIndicator>

        {error && (
          <AlertMessage $type="error">
            <AlertCircle size={17} strokeWidth={2} />
            {error}
          </AlertMessage>
        )}
        {success && (
          <AlertMessage $type="success">
            <CheckCircle2 size={17} strokeWidth={2} />
            {success}
          </AlertMessage>
        )}

        <form onSubmit={handleSubmit}>
          {/* ========== ÉTAPE 1 ========== */}
          {currentStep === 1 && (
            <>
              <FormGrid>
                <ColumnForm>
                  <SectionTitle>
                    <h2>
                      <User size={17} strokeWidth={2} />
                      Informations personnelles
                    </h2>
                  </SectionTitle>

                  <ContainerLabelInput>
                    <Label>Nom <span>*</span></Label>
                    <Input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Prénom <span>*</span></Label>
                    <Input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Email <span>*</span></Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre.email@exemple.com" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Adresse <span>*</span></Label>
                    <Input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Votre adresse complète" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Téléphone <span>*</span></Label>
                    <Input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Votre numéro de téléphone" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Sexe <span>*</span></Label>
                    <Select value={sexe} onChange={(e) => setSexe(e.target.value)} required>
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Mot de passe <span>*</span></Label>
                    <Input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" required minLength={6} />
                    <HelperText>
                      <Info size={12} strokeWidth={2} />
                      Au moins 6 caractères.
                    </HelperText>
                  </ContainerLabelInput>
                </ColumnForm>

                <ColumnForm>
                  <SectionTitle>
                    <h2>
                      <GraduationCap size={17} strokeWidth={2} />
                      Informations académiques
                    </h2>
                  </SectionTitle>

                  <ContainerLabelInput>
                    <Label>Niveau académique <span>*</span></Label>
                    <Input type="text" value={niveauAcademique} onChange={(e) => setNiveauAcademique(e.target.value)} placeholder="Ex : Licence 3, Master 1" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Spécialisation <span>*</span></Label>
                    <Input type="text" value={specialisation} onChange={(e) => setSpecialisation(e.target.value)} placeholder="Ex : Informatique, Gestion" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Université <span>*</span></Label>
                    <Input
                      type="text"
                      value={universite}
                      onChange={(e) => setUniversite(e.target.value)}
                      placeholder="Tapez le nom complet de votre université"
                      list="liste-universites"
                      required
                    />
                    <datalist id="liste-universites">
                      {universites.map((univ) => (
                        <option key={univ.idUniversite} value={univ.nomUniversite} />
                      ))}
                    </datalist>
                    <HelperText>
                      <Info size={12} strokeWidth={2} />
                      {isLoadingUniversites
                        ? 'Chargement des suggestions...'
                        : universites.length > 0
                          ? "Si votre université apparaît dans la liste, sélectionnez-la. Sinon, tapez son nom complet : le rattachement se fera automatiquement lors de son inscription."
                          : "Tapez le nom complet de votre université. Le rattachement se fera automatiquement lors de son inscription."}
                    </HelperText>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Filière <span>*</span></Label>
                    <Input type="text" value={filiere} onChange={(e) => setFiliere(e.target.value)} placeholder="Votre filière d'études" required />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Matricule <span>*</span></Label>
                    <Input type="text" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="Votre matricule" required />
                  </ContainerLabelInput>
                </ColumnForm>
              </FormGrid>

              <ContainerButtons>
                <Button type="button" onClick={handleNext}>
                  Suivant
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Button>
              </ContainerButtons>
            </>
          )}

          {/* ========== ÉTAPE 2 ========== */}
          {currentStep === 2 && (
            <>
              <FormGrid>
                <ColumnForm>
                  <SectionTitle>
                    <h2>
                      <MapPin size={17} strokeWidth={2} />
                      Préférences de localisation
                    </h2>
                  </SectionTitle>

                  <ContainerLabelInput>
                    <Label>Ville</Label>
                    <Input type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ex : Antananarivo" />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Rayon de déplacement</Label>
                    <Input type="text" value={rayonDeplacement} onChange={(e) => setRayonDeplacement(e.target.value)} placeholder="Ex : 10 km" />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Accepte le télétravail</Label>
                    <Select value={accepteTeletravail} onChange={(e) => setAccepteTeletravail(e.target.value)}>
                      <option value="">Sélectionner</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                      <option value="Hybride">Hybride</option>
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Mobilité nationale</Label>
                    <Select value={mobiliteNational} onChange={(e) => setMobiliteNational(e.target.value)}>
                      <option value="">Sélectionner</option>
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </Select>
                  </ContainerLabelInput>
                </ColumnForm>

                <ColumnForm>
                  <SectionTitle>
                    <h2>
                      <Target size={17} strokeWidth={2} />
                      Préférences de stage
                    </h2>
                  </SectionTitle>

                  <ContainerLabelInput>
                    <Label>Type de stage préféré</Label>
                    <Input type="text" value={typeStagePreferee} onChange={(e) => setTypeStagePreferee(e.target.value)} placeholder="Ex : Stage professionnel" />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Type d&apos;entreprise préférée</Label>
                    <Input type="text" value={typeEntreprisePreferee} onChange={(e) => setTypeEntreprisePreferee(e.target.value)} placeholder="Ex : PME, startup, grand groupe" />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Disponibilité immédiate</Label>
                    <Select value={disponibiliteImmediate} onChange={(e) => setDisponibiliteImmediate(e.target.value)}>
                      <option value="">Sélectionner</option>
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </Select>
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Durée souhaitée</Label>
                    <Input type="text" value={dureeSouhaitee} onChange={(e) => setDureeSouhaitee(e.target.value)} placeholder="Ex : 3 mois, 6 mois" />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Début de disponibilité</Label>
                    <Input type="date" value={dateDebutDisponibilite} onChange={(e) => setDateDebutDisponibilite(e.target.value)} />
                  </ContainerLabelInput>

                  <ContainerLabelInput>
                    <Label>Fin de disponibilité</Label>
                    <Input type="date" value={dateFinDisponibilite} onChange={(e) => setDateFinDisponibilite(e.target.value)} />
                  </ContainerLabelInput>
                </ColumnForm>
              </FormGrid>

              <ContainerButtons $spaceBetween>
                <Button type="button" onClick={handlePrevious} $variant="secondary">
                  <ArrowLeft size={15} strokeWidth={2.5} />
                  Précédent
                </Button>
                <Button type="button" onClick={handleNext}>
                  Suivant
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Button>
              </ContainerButtons>
            </>
          )}

          {/* ========== ÉTAPE 3 ========== */}
          {currentStep === 3 && (
            <>
              {/* --- Compétences, sur toute la largeur --- */}
              <SectionTitle>
                <h2>
                  <Wrench size={17} strokeWidth={2} />
                  Mes compétences ({competences.length})
                </h2>
              </SectionTitle>

              <HelperText style={{ marginBottom: '16px' }}>
                <Info size={12} strokeWidth={2} />
                Vos compétences sont le critère le plus important pour recevoir des
                offres qui vous correspondent et pour être remarqué par les recruteurs.
              </HelperText>

              {competences.map((comp, index) => (
                <ItemCard key={index}>
                  <ItemHeader>
                    <ItemBadge>
                      <Wrench size={12} strokeWidth={2.5} />
                      Compétence {index + 1}
                    </ItemBadge>
                    <DeleteItemButton type="button" onClick={() => supprimerCompetence(index)}>
                      <Trash2 size={13} strokeWidth={2} />
                      Retirer
                    </DeleteItemButton>
                  </ItemHeader>

                  <FormGrid>
                    <ColumnForm>
                      <ContainerLabelInput>
                        <Label>Compétence</Label>
                        <Select
                          value={comp.idCompetenceReference}
                          onChange={(e) => modifierCompetence(index, 'idCompetenceReference', e.target.value)}
                        >
                          <option value="">Sélectionner une compétence</option>
                          {referentielDisponible(index).map(r => (
                            <option key={r.idCompetenceReference} value={r.idCompetenceReference}>
                              {r.categorieCompetenceReference
                                ? `${r.categorieCompetenceReference} — ${r.nomCompetenceReference}`
                                : r.nomCompetenceReference}
                            </option>
                          ))}
                        </Select>
                      </ContainerLabelInput>
                    </ColumnForm>

                    <ColumnForm>
                      <ContainerLabelInput>
                        <Label>Niveau de maîtrise</Label>
                        <Select
                          value={comp.niveau}
                          onChange={(e) => modifierCompetence(index, 'niveau', e.target.value)}
                        >
                          {NIVEAUX_COMPETENCE.map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </Select>
                      </ContainerLabelInput>
                    </ColumnForm>
                  </FormGrid>
                </ItemCard>
              ))}

              <AddItemButton type="button" onClick={ajouterCompetence}>
                <Plus size={15} strokeWidth={2.5} />
                Ajouter une compétence
              </AddItemButton>

              {/* --- Parcours et centres d'intérêt, sur deux colonnes --- */}
              <FormGrid style={{ marginTop: '32px' }}>
                <ColumnForm>
                  <SectionTitle>
                    <h2>
                      <Briefcase size={17} strokeWidth={2} />
                      Parcours et réalisations
                    </h2>
                  </SectionTitle>

                  {experiences.map((exp, index) => (
                    <ItemCard key={index}>
                      <ItemHeader>
                        <ItemBadge>
                          <Sparkles size={12} strokeWidth={2.5} />
                          Expérience {index + 1}
                        </ItemBadge>
                        {experiences.length > 1 && (
                          <DeleteItemButton type="button" onClick={() => supprimerExperience(index)}>
                            <Trash2 size={13} strokeWidth={2} />
                            Retirer
                          </DeleteItemButton>
                        )}
                      </ItemHeader>

                      <ContainerLabelInput>
                        <Label>Titre du poste</Label>
                        <Input type="text" value={exp.titrePoste} onChange={(e) => modifierExperience(index, 'titrePoste', e.target.value)} placeholder="Ex : Développeur web" />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Entreprise</Label>
                        <Input type="text" value={exp.entreprise} onChange={(e) => modifierExperience(index, 'entreprise', e.target.value)} placeholder="Nom de l'entreprise" />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Type</Label>
                        <Input type="text" value={exp.type} onChange={(e) => modifierExperience(index, 'type', e.target.value)} placeholder="Ex : Stage, projet personnel" />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Date de début</Label>
                        <Input type="date" value={exp.dateDebut} onChange={(e) => modifierExperience(index, 'dateDebut', e.target.value)} />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Date de fin</Label>
                        <Input type="date" value={exp.dateFin} onChange={(e) => modifierExperience(index, 'dateFin', e.target.value)} />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Description</Label>
                        <TextArea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => modifierExperience(index, 'description', e.target.value)}
                          placeholder="Décrivez vos missions et réalisations"
                        />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Lien</Label>
                        <Input type="text" value={exp.lien} onChange={(e) => modifierExperience(index, 'lien', e.target.value)} placeholder="https://..." />
                      </ContainerLabelInput>
                    </ItemCard>
                  ))}

                  <AddItemButton type="button" onClick={ajouterExperience}>
                    <Plus size={15} strokeWidth={2.5} />
                    Ajouter une expérience
                  </AddItemButton>
                </ColumnForm>

                <ColumnForm>
                  <SectionTitle>
                    <h2>
                      <Heart size={17} strokeWidth={2} />
                      Centres d&apos;intérêt
                    </h2>
                  </SectionTitle>

                  {centresInteret.map((centre, index) => (
                    <ItemCard key={index} $variant="sauge">
                      <ItemHeader>
                        <ItemBadge $variant="sauge">
                          <Heart size={12} strokeWidth={2.5} />
                          Centre {index + 1}
                        </ItemBadge>
                        {centresInteret.length > 1 && (
                          <DeleteItemButton type="button" onClick={() => supprimerCentreInteret(index)}>
                            <Trash2 size={13} strokeWidth={2} />
                            Retirer
                          </DeleteItemButton>
                        )}
                      </ItemHeader>

                      <ContainerLabelInput>
                        <Label>Domaine d&apos;intérêt</Label>
                        <Input type="text" value={centre.domaine} onChange={(e) => modifierCentreInteret(index, 'domaine', e.target.value)} placeholder="Ex : Développement web" />
                      </ContainerLabelInput>

                      <ContainerLabelInput>
                        <Label>Mission préférée</Label>
                        <Input type="text" value={centre.mission} onChange={(e) => modifierCentreInteret(index, 'mission', e.target.value)} placeholder="Ex : Gestion de projet" />
                      </ContainerLabelInput>
                    </ItemCard>
                  ))}

                  <AddItemButton type="button" onClick={ajouterCentreInteret}>
                    <Plus size={15} strokeWidth={2.5} />
                    Ajouter un centre d&apos;intérêt
                  </AddItemButton>
                </ColumnForm>
              </FormGrid>

              <ContainerButtons $spaceBetween>
                <Button type="button" onClick={handlePrevious} $variant="secondary" disabled={loading}>
                  <ArrowLeft size={15} strokeWidth={2.5} />
                  Précédent
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : (
                    <>
                      <Save size={15} strokeWidth={2} />
                      Créer mon compte
                    </>
                  )}
                </Button>
              </ContainerButtons>
            </>
          )}
        </form>
      </ContainerForm>
    </PageContainer>
  )
}