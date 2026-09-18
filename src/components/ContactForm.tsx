import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "failed";

/**
 * Posts same-origin to /api/contact, which CloudFront routes to the enquiry
 * function. Field names match what that function validates.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setErrors([]);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; errors?: string[] };
      if (response.ok && body.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("failed");
        setErrors(body.errors?.length ? body.errors : ["Something went wrong. Please try again."]);
      }
    } catch {
      setStatus("failed");
      setErrors(["Could not reach the server. Please try again."]);
    }
  }

  if (status === "sent") {
    return (
      <div className="contact-done" role="status">
        <h3>Thank you — we have your enquiry.</h3>
        <p>We&rsquo;ll reply to the email address you gave us.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-grid">
        <label className="field">
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required maxLength={200} />
        </label>
        <label className="field">
          <span>Work email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={320} />
        </label>
        <label className="field">
          <span>
            Phone <em>(optional)</em>
          </span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={50} />
        </label>
      </div>

      <label className="field">
        <span>Your use case</span>
        <textarea
          name="useCase"
          rows={5}
          required
          minLength={20}
          maxLength={5000}
          placeholder="Which systems hold the data, what gets reconciled, and where the effort goes today."
        />
      </label>

      {/* Honeypot: hidden from people, filled by bots. The server drops any submission with a value here. */}
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      {errors.length > 0 && (
        <ul className="form-error" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="contact-actions">
        <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send enquiry"}
        </button>
        <span className="contact-note">No mailing list. We reply once, to you.</span>
      </div>
    </form>
  );
}
