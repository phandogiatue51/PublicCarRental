using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;

public interface IDocumentRepository
{
    public IQueryable<AccountDocument> GetAll();
    public void CreateDocument(AccountDocument document);
    public void UpdateDocument(AccountDocument document);
    public void UpdateRange(List<AccountDocument> documents);
    public void DeleteDocument(AccountDocument document);
}

public class DocumentRepository : IDocumentRepository
{
    private readonly EVRentalDbContext _context;

    public DocumentRepository(EVRentalDbContext context)
    {
        _context = context;
    }

    public IQueryable<AccountDocument> GetAll()
    {
        return _context.AccountDocuments
            .Include(a => a.Account)
            .Include(a => a.Staff);
    }

    public void CreateDocument (AccountDocument document)
    {
        _context.AccountDocuments.Add(document);
        _context.SaveChanges();
    }

    public void UpdateDocument (AccountDocument document)
    {
        _context.AccountDocuments.Update(document);
        _context.SaveChanges();
    }

    public void UpdateRange(List<AccountDocument> documents)
    {
        _context.AccountDocuments.UpdateRange(documents);
        _context.SaveChanges();
    }

    public void DeleteDocument(AccountDocument document)
    {
        _context.AccountDocuments.Remove(document);
        _context.SaveChanges();
    }
}