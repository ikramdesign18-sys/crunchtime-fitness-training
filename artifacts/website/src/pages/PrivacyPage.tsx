import LegalPage from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This Privacy Policy explains how Crunchtime Fitness Training may collect, use, store, and protect information when clients and trainers use the app."
    >
      <p>
        <strong>Last updated:</strong> [Add date]
      </p>
      <h2>Introduction</h2>
      <p>
        Crunchtime Fitness Training is designed for fitness coaching, workout support, progress
        tracking, communication, bookings, video submissions, and live coaching. This policy uses
        clear language so users understand what information may be involved in those features.
      </p>

      <h2>Information We Collect</h2>
      <p>
        The app may collect information that users provide directly, information generated through
        app activity, and technical information needed to operate the service.
      </p>

      <h2>Account Information</h2>
      <p>
        We may collect account details such as name, email address, role, authentication state, and
        profile setup status so users can securely access the right client or trainer experience.
      </p>

      <h2>Fitness Profile Information</h2>
      <p>
        Users may provide fitness goals, training preferences, body measurements, experience level,
        and related coaching context. This information helps personalize the app experience.
      </p>

      <h2>BMI, Workout, Progress, and Meal Plan Data</h2>
      <p>
        The app may store BMI records, workout completion, progress history, meal plan interactions,
        and consistency data. This information is used to help users and trainers understand fitness
        habits over time.
      </p>

      <h2>Chat and Booking Information</h2>
      <p>
        Messages, booking requests, session status, dates, times, and related notes may be processed
        so clients and trainers can communicate and manage coaching sessions.
      </p>

      <h2>Video Submissions</h2>
      <p>
        Users may submit exercise videos for trainer review. These videos may be stored and accessed
        for coaching feedback, form review, and related training support.
      </p>

      <h2>Live Video Call Information</h2>
      <p>
        Live coaching calls may require temporary call session details, such as channel information
        and access tokens, to connect users and trainers. Calls are intended for coaching
        communication, not medical diagnosis.
      </p>

      <h2>How Information Is Used</h2>
      <p>
        Information may be used to provide authentication, personalize fitness content, show progress,
        support trainer feedback, manage bookings, enable communication, send notifications, improve
        reliability, and protect the service.
      </p>

      <h2>How Information Is Stored</h2>
      <p>
        Information may be stored in secure application databases, authentication systems, and storage
        services used by the app. Access should be limited to authorized users and service operations.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        The app may rely on third-party providers to deliver authentication, database, storage, and
        live video functionality. These providers process information according to their own terms
        and privacy practices.
      </p>

      <h2>Supabase</h2>
      <p>
        Supabase may be used for authentication, database records, and storage, including user
        accounts, profiles, progress data, bookings, chat data, notifications, and video submission
        files.
      </p>

      <h2>Agora</h2>
      <p>
        Agora may be used to support live video call functionality. Agora-related session details are
        used to connect participants for coaching calls.
      </p>

      <h2>Data Security</h2>
      <p>
        Reasonable technical and organizational measures should be used to protect information.
        However, no digital service can guarantee absolute security.
      </p>

      <h2>User Control and Data Deletion Requests</h2>
      <p>
        Users may request access, correction, or deletion of their account information where
        applicable. To make a request, contact [support@crunchtimefitness.example].
      </p>

      <h2>Children's Privacy</h2>
      <p>
        The app is not intended for children under the age required by applicable law. If information
        from a child is discovered, a deletion request can be sent to the contact address above.
      </p>

      <h2>Fitness and Health Disclaimer</h2>
      <p>
        Crunchtime Fitness Training supports fitness, coaching, and wellness habits. It does not
        provide medical diagnosis, treatment, or professional medical advice. Users should consult a
        qualified healthcare professional before starting any fitness or nutrition program.
      </p>

      <h2>Contact Information</h2>
      <p>
        For privacy questions or requests, contact [support@crunchtimefitness.example].
      </p>
    </LegalPage>
  );
}
