'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/lib/auth'
import AppNavbar from '@/components/appNavbar'
import { UserPlus, Info, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import {
  NIVEAUX_ACADEMIQUES, LIBELLES_DOMAINES, filieresDuDomaine
} from '@/lib/referentiels'
import { REGLE_MOT_DE_PASSE } from '@/lib/motDePasse'
import {
  PageContainer, PageHeader, PageTitle, PageSubtitle,
  CandidatureCard, OffreTitre,
  CardMeta, MetaItem, CardFooter, ActionButton,
  EmptyState
} from '@/components/styleEtudiantCandidature'

const champStyle = {
  padding: '11px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: 9, fontSize: 14, outline: 'none', width: '100%'
}

export default function UniversiteAjoutEtudiant() {
  const router = useRouter()
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', motDePasse: '',
    matricule: '', niveauAcademique: '', filiere: '', specialisation: ''
  })
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  const maj = (champ, valeur) => setForm(prev => ({ ...prev, [champ]: valeur }))

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur(''); setMessage(''); setEnCours(true)
    try {
      const res = await fetchAuth('/api/universiteAjoutEtudiant', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Création impossible')

      setMessage(data.message)
      setForm({
        nom: '', prenom: '', email: '', telephone: '', motDePasse: '',
        matricule: '', niveauAcademique: '', filiere: '', specialisation: ''
      })
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnCours(false)
    }
  }

  const Champ = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</label>
      {children}
    </div>
  )

  return (
    <>
      <AppNavbar />
      <PageContainer>
        <PageHeader>
          <PageTitle>
            <UserPlus size={24} strokeWidth={2} />
            Ajouter un étudiant
          </PageTitle>
          <PageSubtitle>
            Créez le compte d&apos;un étudiant de votre établissement. Il sera
            directement rattaché à votre université, sans validation supplémentaire.
          </PageSubtitle>
        </PageHeader>

        {erreur && (
          <EmptyState style={{ marginBottom: 16, borderStyle: 'solid', borderColor: '#fca5a5' }}>
            <AlertCircle size={16} strokeWidth={2} /> {erreur}
          </EmptyState>
        )}
        {message && (
          <EmptyState style={{ marginBottom: 16, borderStyle: 'solid', borderColor: '#d6dcb3' }}>
            <CheckCircle2 size={16} strokeWidth={2} /> {message}
          </EmptyState>
        )}

        <form onSubmit={envoyer}>
          <CandidatureCard>
            <OffreTitre>Informations de l&apos;étudiant</OffreTitre>

            <div style={{ marginTop: 16 }}>
              <Champ label="Prénom *">
                <input style={champStyle} value={form.prenom} required
                  onChange={(e) => maj('prenom', e.target.value)} />
              </Champ>
              <Champ label="Nom *">
                <input style={champStyle} value={form.nom} required
                  onChange={(e) => maj('nom', e.target.value)} />
              </Champ>
              <Champ label="Adresse e-mail *">
                <input style={champStyle} type="email" value={form.email} required
                  onChange={(e) => maj('email', e.target.value)} />
              </Champ>
              <Champ label="Téléphone">
                <input style={champStyle} value={form.telephone}
                  onChange={(e) => maj('telephone', e.target.value)} />
              </Champ>
              <Champ label="Matricule">
                <input style={champStyle} value={form.matricule}
                  onChange={(e) => maj('matricule', e.target.value)} />
              </Champ>

              <Champ label="Niveau académique">
                <select style={champStyle} value={form.niveauAcademique}
                  onChange={(e) => maj('niveauAcademique', e.target.value)}>
                  <option value="">Sélectionner un niveau</option>
                  {NIVEAUX_ACADEMIQUES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Champ>

              <Champ label="Filière">
                <select style={champStyle} value={form.filiere}
                  onChange={(e) => { maj('filiere', e.target.value); maj('specialisation', '') }}>
                  <option value="">Sélectionner une filière</option>
                  {LIBELLES_DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Champ>

              <Champ label="Spécialisation">
                <select style={champStyle} value={form.specialisation} disabled={!form.filiere}
                  onChange={(e) => maj('specialisation', e.target.value)}>
                  <option value="">
                    {form.filiere ? 'Sélectionner une spécialisation' : "Choisissez d'abord une filière"}
                  </option>
                  {filieresDuDomaine(form.filiere).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Champ>

              <Champ label="Mot de passe provisoire *">
                <input style={champStyle} type="text" value={form.motDePasse} required
                  onChange={(e) => maj('motDePasse', e.target.value)} />
              </Champ>

              <CardMeta>
                <MetaItem>
                  <Info size={13} strokeWidth={2} />
                  {REGLE_MOT_DE_PASSE} Communiquez-le à l&apos;étudiant, qui pourra le
                  modifier depuis son profil.
                </MetaItem>
              </CardMeta>
            </div>

            <CardFooter>
              <ActionButton type="button" onClick={() => router.push('/pages/universiteEtudiant')}>
                <ArrowLeft size={13} strokeWidth={2} /> Mes étudiants
              </ActionButton>
              <ActionButton type="submit" disabled={enCours}>
                <UserPlus size={13} strokeWidth={2} />
                {enCours ? 'Création en cours...' : 'Créer le compte'}
              </ActionButton>
            </CardFooter>
          </CandidatureCard>
        </form>
      </PageContainer>
    </>
  )
}
