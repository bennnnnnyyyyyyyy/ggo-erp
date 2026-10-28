Skip to content
SupabaseBack to organization home
ggoerp
Free

ggoerp

main
Production


Connect

Feedback

Search...

Ctrl K

Help

Advisor Center

SQL Editor

AI Assistant

meetingsdmedeskai-cmyk
Compute
New
Advisors

Authentication
Manage
Users
OAuth Apps
Notifications
Emails
Configuration
Policies
Sign In / Providers
Passkeys
Beta
OAuth Server
Beta
Sessions
Rate Limits
Multi-Factor
URL Configuration
Attack Protection
Auth Hooks
Beta
Audit Logs
Performance
OAuth Server
Configure your project to act as an identity provider for third-party applications
Docs

Enable the Supabase OAuth Server
Enable OAuth server functionality for your project to create and manage OAuth applications.
http://localhost:5173
Site URL
The base URL of your application, configured in Auth URL Configuration settings.
/oauth/consent
Authorization Path
Path where you'll implement the OAuth authorization UI (consent screens).
Make sure this path is implemented in your application.

Preview Authorization URL: http://localhost:5173/oauth/consent

Allow Dynamic OAuth Apps
Enable dynamic OAuth app registration. Apps can be registered programmatically via APIs. Learn more

Cancel

Save changes
OAuth Endpoints
Share these endpoints with third-party applications that need to integrate with your OAuth 2.1 server.
Authorization endpoint
https://plhuuhcpvlytozyedamt.supabase.co/auth/v1/oauth/authorize
Token endpoint
https://plhuuhcpvlytozyedamt.supabase.co/auth/v1/oauth/token
JWKS endpoint
https://plhuuhcpvlytozyedamt.supabase.co/auth/v1/.well-known/jwks.json
OIDC discovery
https://plhuuhcpvlytozyedamt.supabase.co/auth/v1/.well-known/openid-configuration
SQL Editor



1

Hit
Ctrl ⇧ K
to edit with the Assistant

Save as snippet

Run
Ctrl ↵

OAuth server settings updated successfully
