import React from 'react'

export default function InstructionsTab() {
  return (
    <div>
      <div style={card}>
        <div style={cardTitle}>About</div>
        <div style={abstract}>
          Survivor Golf is a pick optimizer for prize money survivor leagues. Each week, 
          it pulls live predictions from DataGolf's pre-tournament model — which accounts 
          for player skill, course fit, and course history — and ranks available players 
          by expected prize money. The model also applies an opportunity cost adjustment, 
          penalizing elite picks in weeks where saving them for a higher-EV future event 
          makes more sense.
        </div>
        <div style={betaBadge}>Beta</div>
        <div style={betaNote}>
          This tool is in beta. If you encounter any bugs or have suggestions, 
          reach out to Dylan directly.
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>How to use</div>
        <Section step="1" title="Add your used picks">
          Go to the <strong>My picks</strong> tab and add every player you've already picked 
          this season. Do this once — picks are saved to your browser and will be there next 
          time you open the app. These players are automatically excluded from recommendations.
        </Section>
        <Section step="2" title="Check this week's recommendations">
          The <strong>This week</strong> tab shows the current tournament and ranks all available 
          players by expected prize money. Check it each week before making your pick.
        </Section>
        <Section step="3" title="Understand the score">
          Each player is scored on two factors: expected prize money this week and an opportunity
          cost adjustment (should you save this player for a better week?).
        </Section>
        <Section step="4" title="Log your opponent's picks">
          After picks lock each week, go to the <strong>Opponent</strong> tab and log what your
          opponent picked. This flags conflicts in future recommendations.
        </Section>
        <Section step="5" title="After you pick, add yourself">
          Once you've made your pick, go back to <strong>My picks</strong> and add that player 
          so they're excluded from future recommendations.
        </Section>
      </div>

      <div style={card}>
        <div style={cardTitle}>Scoring model</div>
        <div style={bodyText}>
          <p style={para}><strong>Expected prize money</strong> is calculated by multiplying 
          DataGolf's finish probabilities (win, top 5, top 10, top 20, make cut) by the 
          approximate prize payout for each finish position on this week's purse.</p>

          <p style={para}><strong>Opportunity cost</strong> compares a player's expected value 
          this week against their projected EV at remaining elevated events and majors. If a 
          future event offers meaningfully higher expected value, the player's score is 
          penalized and a "save for later" badge appears. Elite players (DataGolf rank ≤ 25) 
          in weak-field weeks are most likely to be flagged.</p>

          <p style={para}><strong>Field strength</strong> is automatically accounted for — 
          DataGolf's win probabilities are calculated against the actual field each week, so 
          a player's score naturally rises in weak-field weeks and falls in stacked fields.</p>
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>Limitations & known issues</div>
        <div style={bodyText}>
          <p style={para}>• Purse amounts are estimated based on event name. If an event shows 
          an incorrect purse, contact Dylan.</p>
          <p style={para}>• Picks are stored in your browser. Clearing browser data or switching 
          devices will reset your picks.</p>
          <p style={para}>• DataGolf predictions typically update Monday–Tuesday each week. 
          Early in the week, field data may not yet be available.</p>
          <p style={para}>• This tool is for informational purposes only and does not guarantee 
          any particular outcome.</p>
        </div>
      </div>

      <div style={footer}>
        Built for the survivor league · Powered by{' '}
        <a href="https://datagolf.com" target="_blank" rel="noreferrer" style={link}>DataGolf</a>
        {' '}· Beta v1.0
      </div>
    </div>
  )
}

function Section({ step, title, children }) {
  return (
    <div style={section}>
      <div style={stepRow}>
        <div style={stepNum}>{step}</div>
        <div style={stepTitle}>{title}</div>
      </div>
      <div style={stepBody}>{children}</div>
    </div>
  )
}

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: 12 }
const cardTitle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', marginBottom: 12 }
const abstract = { fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, fontFamily: 'Georgia, serif', marginBottom: 16 }
const betaBadge = { display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 10, background: 'var(--amber-bg)', color: 'var(--amber)', fontFamily: 'system-ui, sans-serif', fontWeight: 600, marginBottom: 8 }
const betaNote = { fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }
const section = { marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }
const stepRow = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }
const stepNum = { width: 24, height: 24, borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--surface)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'system-ui, sans-serif' }
const stepTitle = { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }
const stepBody = { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'system-ui, sans-serif', paddingLeft: 34 }
const bodyText = { fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif' }
const para = { lineHeight: 1.65, marginBottom: 10 }
const footer = { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'system-ui, sans-serif', padding: '8px 0 16px' }
const link = { color: 'var(--text-secondary)', textDecoration: 'underline' }
