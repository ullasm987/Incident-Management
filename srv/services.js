const cds = require('@sap/cds')

class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  init() {
    const { Incidents } = this.entities;
    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));
    this.on("changeStatus", "Incidents", async (req) => {
      console.log(req.subject);
      const incidentID = req.params[0].ID;
      try {
        let data = await SELECT.one(req.subject);
        console.log(data);
        if (data.status_code === 'C') {
          req.reject`Can't change status of a closed incident!`
        } else {
          await UPDATE(Incidents)
            .set({
              status_code: 'C'
            })
            .where({ ID: incidentID });
        }
      } catch (error) {
        console.error(error);
      }

    });

    return super.init();
  }

  changeUrgencyDueToSubject(data) {
    let urgent = data.title?.match(/urgent/i)
    if (urgent) data.urgency_code = 'H'
  }

  /** Custom Validation */
  async onUpdate(req) {
    let closed = await SELECT.one(1).from(req.subject).where`status.code = 'C'`
    if (closed) req.reject`Can't modify a closed incident!`
  }
}
module.exports = { ProcessorService }
