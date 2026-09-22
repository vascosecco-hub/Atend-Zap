import AgentCard from './AgentCard'
import styles from './styles.module.css'

const agents = [
  {
    number: '01',
    name: 'Materiais de Construção',
    route: 'construcao',
    description: 'Pedidos, endereço de obra, data e hora de entrega',
    color: '#F59E0B',
    gradient: 'rgba(255, 210, 80, 0.7)',
    gradientLight: 'rgba(255, 200, 60, 0.9)',
    textDark: '#3A1F00',
    iconBg: '#FFE082',
    iconPath: 'M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5zM11 13h2v5h-2v-5z',
    widgetUrl: 'https://app.gptmaker.ai/widget/3E7ABBD10E50B14C339A728E885DA344/float.js',
  },
  {
    number: '02',
    name: 'Gastronomia',
    route: 'gastronomia',
    description: 'Pedido, endereço, forma de pagamento, data e hora',
    color: '#FB923C',
    gradient: 'rgba(255, 170, 60, 0.65)',
    gradientLight: 'rgba(255, 160, 40, 0.9)',
    textDark: '#2A0F00',
    iconBg: '#FFCC80',
    iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    widgetUrl: 'https://app.gptmaker.ai/widget/3E85F2A3DA4031A6D17E8A7F6D386327/float.js',
  },
  {
    number: '03',
    name: 'Produtos Médicos',
    route: 'medico',
    description: 'Produto, indicação, endereço, data e hora',
    color: '#38BDF8',
    gradient: 'rgba(160, 210, 255, 0.7)',
    gradientLight: 'rgba(147, 210, 255, 0.92)',
    textDark: '#062040',
    iconBg: '#BAE6FD',
    iconPath: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z',
    widgetUrl: 'https://app.gptmaker.ai/widget/3E7AED03B65722FAB7D54E3016F89FC4/float.js',
  },
  {
    number: '04',
    name: 'PetShop e Veterinária',
    route: 'petshop',
    description: 'Pet, serviço, endereço ou data e hora da consulta',
    color: '#22C55E',
    gradient: 'rgba(140, 230, 150, 0.65)',
    gradientLight: 'rgba(134, 239, 172, 0.92)',
    textDark: '#022010',
    iconBg: '#BBF7D0',
    iconPath: 'M4.5 9.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S6.83 8 6 8s-1.5.67-1.5 1.5zm3 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-1.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zM12 4c-1.93 0-3.5 1.57-3.5 3.5h7c0-1.93-1.57-3.5-3.5-3.5zM4 14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-1H4v1z',
    widgetUrl: 'https://app.gptmaker.ai/widget/3E73006DA89662ED5593FE792A068AF7/float.js',
  },
]

export default function HomePage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Atendimentos WhatsApp</h1>
        <p className={styles.subtitle}>Escolha o setor para ser atendido</p>
      </header>

      <div className={styles.grid}>
        {agents.map((agent) => (
          <AgentCard key={agent.number} agent={agent} />
        ))}
      </div>

      <footer className={styles.footer}>
        <a href="/crm" className={styles.crmLink}>
          Acessar CRM
        </a>
        <p className={styles.lgpd}>
          Ao continuar, você concorda com o uso dos seus dados apenas para atendimento.
        </p>
      </footer>
    </main>
  )
}