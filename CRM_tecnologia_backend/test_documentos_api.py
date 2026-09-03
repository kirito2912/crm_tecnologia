import io
from fastapi.testclient import TestClient
from app.main import app
from app.db.conexion import engine, Base, SessionLocal
from app.db.seed_data import seed_database
from app.models.documento import Documento

# 1. Asegurar base de datos y datos sembrados
Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_database(db, force_reset=True)
db.close()

client = TestClient(app)

def test_documentos_flow():
    print("\n--- 1. Probando GET /api/v1/documentos/ ---")
    res = client.get("/api/v1/documentos/")
    assert res.status_code == 200, f"Error en GET: {res.text}"
    docs = res.json()
    print(f"Documentos iniciales sembrados: {len(docs)}")
    assert len(docs) >= 4, "Debe haber al menos 4 documentos iniciales"
    for d in docs:
        print(f" -> [{d['tipo'].upper()}] {d['nombre']} ({d['tamanio']}) - Subido por: {d['subido_por']} ({d['usuario_rol']})")

    print("\n--- 2. Probando POST /api/v1/documentos/upload (Subida de PDF) ---")
    fake_pdf_bytes = b"%PDF-1.4 Fake PDF Content for Test"
    files = {
        "file": ("Auditoria_Q3_Test.pdf", fake_pdf_bytes, "application/pdf")
    }
    data = {
        "categoria": "Auditoría",
        "descripcion": "Documento de auditoría de prueba subido por el analista.",
        "subido_por": "Carlos Mendoza",
        "usuario_id": "USR-ANALISTA",
        "usuario_rol": "analista",
        "tags": '["auditoria", "test", "q3"]'
    }
    upload_res = client.post("/api/v1/documentos/upload", files=files, data=data)
    assert upload_res.status_code == 201, f"Error en upload: {upload_res.text}"
    uploaded_doc = upload_res.json()
    doc_id = uploaded_doc["id"]
    print(f"Documento PDF subido exitosamente: ID={doc_id}, Nombre={uploaded_doc['nombre']}, Base64 length={len(uploaded_doc.get('archivo_base64') or '')}")

    print("\n--- 3. Probando GET /api/v1/documentos/{id}/download ---")
    dl_res = client.get(f"/api/v1/documentos/{doc_id}/download")
    assert dl_res.status_code == 200, f"Error en download: {dl_res.text}"
    assert len(dl_res.content) > 0, "El contenido descargado no debe estar vacío"
    print(f"Descarga verificada correctamente ({len(dl_res.content)} bytes descargados)")

    print("\n--- 4. Probando PATCH /api/v1/documentos/{id} (Actualización de metadatos) ---")
    patch_res = client.patch(f"/api/v1/documentos/{doc_id}", json={
        "categoria": "Contratos",
        "descripcion": "Descripción actualizada para contrato corporativo."
    })
    assert patch_res.status_code == 200
    patched = patch_res.json()
    assert patched["categoria"] == "Contratos"
    print(f"Documento actualizado: Categoría={patched['categoria']}")

    print("\n--- 5. Probando DELETE /api/v1/documentos/{id} ---")
    del_res = client.delete(f"/api/v1/documentos/{doc_id}")
    assert del_res.status_code == 200
    print(f"Documento {doc_id} eliminado exitosamente.")

    # Verificar que ya no está
    get_res = client.get(f"/api/v1/documentos/{doc_id}")
    assert get_res.status_code == 404
    print("Verificación de eliminación confirmada (404 Not Found).")

    print("\nTODOS LOS TESTS DEL MÓDULO DE DOCUMENTOS PASARON EXITOSAMENTE.")

if __name__ == "__main__":
    test_documentos_flow()
