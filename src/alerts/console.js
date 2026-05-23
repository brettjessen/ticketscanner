export async function sendConsoleAlert(alert) {
  console.log('\n=== TICKET ALERT ===');
  console.log(alert.subject);
  console.log(alert.body);
  console.log('====================\n');
}
