using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AcieClientApi.Controllers
{
    
    public class Client
    {
        public int ClientId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        
        private static readonly List<Client> ClientsList = new List<Client>
        {
            new Client { ClientId = 1, FirstName = "Bevinto", LastName = "Paul", Email = "bevintop@gmail.com", IsActive = true },
            new Client { ClientId = 2, FirstName = "John", LastName = "Doe", Email = "john.doe@example.com", IsActive = true }
        };

       
        [HttpGet]
        public ActionResult<IEnumerable<Client>> GetAllClients()
        {
            return Ok(ClientsList);
        }

        [HttpGet("{id}")]
        public ActionResult<Client> GetClientById(int id)
        {
            var client = ClientsList.Find(c => c.ClientId == id);
            if (client == null)
            {
                return NotFound(new { message = $"Client with ID {id} not found." });
            }
            return Ok(client);
        }

        
        [HttpPost]
        public ActionResult<Client> CreateClient([FromBody] Client newClient)
        {
            newClient.ClientId = ClientsList.Count + 1;
            ClientsList.Add(newClient);
            return CreatedAtAction(nameof(GetClientById), new { id = newClient.ClientId }, newClient);
        }
    }
}
