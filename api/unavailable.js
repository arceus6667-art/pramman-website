/** Hosted frontend boundary: applicant data must stay on a persistent server. */
export default function handler(_request, response) {
  response.statusCode = 503;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify({error:'Registration and administrator services are not available on this hosted website yet. Please check back for updates.'}));
}
