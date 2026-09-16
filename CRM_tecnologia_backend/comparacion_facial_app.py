import tkinter as tk
from tkinter import ttk, messagebox
import cv2
from PIL import Image, ImageTk
import boto3
import os
from dotenv import load_dotenv
import io

# Cargar variables de entorno
load_dotenv()

class ComparacionFacialApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Comparación Facial con AWS Rekognition")
        self.root.geometry("1200x700")
        self.root.configure(bg='#2c3e50')
        
        # Cliente de AWS Rekognition
        self.rekognition_client = boto3.client(
            'rekognition',
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        )
        
        # Variables para las imágenes
        self.imagen1 = None
        self.imagen2 = None
        self.cap = None
        self.camara_activa = None  # 1 o 2
        
        self.setup_ui()
        
    def setup_ui(self):
        # Título principal
        titulo = tk.Label(
            self.root,
            text="COMPARACIÓN FACIAL",
            font=("Arial", 24, "bold"),
            bg='#2c3e50',
            fg='white'
        )
        titulo.pack(pady=20)
        
        # Frame principal para las dos columnas
        main_frame = tk.Frame(self.root, bg='#2c3e50')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # ========== COLUMNA IZQUIERDA - CÁMARA ==========
        left_frame = tk.Frame(main_frame, bg='#34495e', relief=tk.RAISED, borderwidth=3)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Título Persona 1
        tk.Label(
            left_frame,
            text="PERSONA 1",
            font=("Arial", 16, "bold"),
            bg='#34495e',
            fg='#3498db'
        ).pack(pady=10)
        
        # Canvas para mostrar video/imagen 1
        self.canvas1 = tk.Canvas(left_frame, width=480, height=360, bg='black')
        self.canvas1.pack(pady=10)
        
        # Botones Persona 1
        btn_frame1 = tk.Frame(left_frame, bg='#34495e')
        btn_frame1.pack(pady=10)
        
        self.btn_cam1 = tk.Button(
            btn_frame1,
            text="📷 Abrir Cámara",
            command=lambda: self.toggle_camara(1),
            bg='#3498db',
            fg='white',
            font=("Arial", 12, "bold"),
            width=15,
            cursor='hand2'
        )
        self.btn_cam1.pack(side=tk.LEFT, padx=5)
        
        self.btn_capture1 = tk.Button(
            btn_frame1,
            text="📸 Capturar Foto",
            command=lambda: self.capturar_foto(1),
            bg='#27ae60',
            fg='white',
            font=("Arial", 12, "bold"),
            width=15,
            cursor='hand2',
            state=tk.DISABLED
        )
        self.btn_capture1.pack(side=tk.LEFT, padx=5)
        
        # Título Persona 2
        tk.Label(
            left_frame,
            text="PERSONA 2",
            font=("Arial", 16, "bold"),
            bg='#34495e',
            fg='#e74c3c'
        ).pack(pady=(20, 10))
        
        # Canvas para mostrar video/imagen 2
        self.canvas2 = tk.Canvas(left_frame, width=480, height=360, bg='black')
        self.canvas2.pack(pady=10)
        
        # Botones Persona 2
        btn_frame2 = tk.Frame(left_frame, bg='#34495e')
        btn_frame2.pack(pady=10)
        
        self.btn_cam2 = tk.Button(
            btn_frame2,
            text="📷 Abrir Cámara",
            command=lambda: self.toggle_camara(2),
            bg='#e74c3c',
            fg='white',
            font=("Arial", 12, "bold"),
            width=15,
            cursor='hand2'
        )
        self.btn_cam2.pack(side=tk.LEFT, padx=5)
        
        self.btn_capture2 = tk.Button(
            btn_frame2,
            text="📸 Capturar Foto",
            command=lambda: self.capturar_foto(2),
            bg='#27ae60',
            fg='white',
            font=("Arial", 12, "bold"),
            width=15,
            cursor='hand2',
            state=tk.DISABLED
        )
        self.btn_capture2.pack(side=tk.LEFT, padx=5)
        
        # ========== COLUMNA DERECHA - RESULTADOS ==========
        right_frame = tk.Frame(main_frame, bg='#34495e', relief=tk.RAISED, borderwidth=3)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Título Resultados
        tk.Label(
            right_frame,
            text="RESULTADOS DE COMPARACIÓN",
            font=("Arial", 16, "bold"),
            bg='#34495e',
            fg='#f39c12'
        ).pack(pady=20)
        
        # Frame para los resultados
        results_container = tk.Frame(right_frame, bg='#2c3e50')
        results_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Área de texto para resultados
        self.text_resultados = tk.Text(
            results_container,
            font=("Courier New", 11),
            bg='#1a1a1a',
            fg='#00ff00',
            wrap=tk.WORD,
            padx=15,
            pady=15
        )
        self.text_resultados.pack(fill=tk.BOTH, expand=True)
        
        # Scrollbar
        scrollbar = tk.Scrollbar(self.text_resultados)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.text_resultados.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.text_resultados.yview)
        
        # Mensaje inicial
        self.text_resultados.insert("1.0", 
            "═══════════════════════════════════════════\n"
            "   SISTEMA DE COMPARACIÓN FACIAL\n"
            "   Powered by AWS Rekognition\n"
            "═══════════════════════════════════════════\n\n"
            "INSTRUCCIONES:\n"
            "1. Abra la cámara para la Persona 1\n"
            "2. Capture la foto de la Persona 1\n"
            "3. Abra la cámara para la Persona 2\n"
            "4. Capture la foto de la Persona 2\n"
            "5. Presione 'Comparar Rostros'\n\n"
            "Esperando capturas...\n"
        )
        self.text_resultados.config(state=tk.DISABLED)
        
        # Botón de comparación
        self.btn_comparar = tk.Button(
            right_frame,
            text="⚡ COMPARAR ROSTROS",
            command=self.comparar_rostros,
            bg='#f39c12',
            fg='white',
            font=("Arial", 14, "bold"),
            width=25,
            height=2,
            cursor='hand2',
            state=tk.DISABLED
        )
        self.btn_comparar.pack(pady=20)
        
        # Botón de limpiar
        btn_limpiar = tk.Button(
            right_frame,
            text="🔄 Limpiar Todo",
            command=self.limpiar_todo,
            bg='#95a5a6',
            fg='white',
            font=("Arial", 11),
            width=20,
            cursor='hand2'
        )
        btn_limpiar.pack(pady=10)
        
    def toggle_camara(self, numero):
        if self.camara_activa == numero:
            # Cerrar cámara
            self.cerrar_camara()
        else:
            # Cerrar cualquier cámara abierta
            if self.cap is not None:
                self.cerrar_camara()
            
            # Abrir nueva cámara
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                messagebox.showerror("Error", "No se pudo abrir la cámara")
                return
            
            self.camara_activa = numero
            
            # Actualizar botones
            if numero == 1:
                self.btn_cam1.config(text="🔴 Cerrar Cámara", bg='#c0392b')
                self.btn_capture1.config(state=tk.NORMAL)
                self.btn_cam2.config(state=tk.DISABLED)
            else:
                self.btn_cam2.config(text="🔴 Cerrar Cámara", bg='#c0392b')
                self.btn_capture2.config(state=tk.NORMAL)
                self.btn_cam1.config(state=tk.DISABLED)
            
            self.actualizar_video()
    
    def cerrar_camara(self):
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        
        if self.camara_activa == 1:
            self.btn_cam1.config(text="📷 Abrir Cámara", bg='#3498db')
            self.btn_capture1.config(state=tk.DISABLED)
            self.btn_cam2.config(state=tk.NORMAL)
        elif self.camara_activa == 2:
            self.btn_cam2.config(text="📷 Abrir Cámara", bg='#e74c3c')
            self.btn_capture2.config(state=tk.DISABLED)
            self.btn_cam1.config(state=tk.NORMAL)
        
        self.camara_activa = None
    
    def actualizar_video(self):
        if self.cap is not None and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                # Redimensionar frame
                frame = cv2.resize(frame, (480, 360))
                
                # Convertir de BGR a RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Convertir a ImageTk
                img = Image.fromarray(frame_rgb)
                imgtk = ImageTk.PhotoImage(image=img)
                
                # Mostrar en el canvas correspondiente
                if self.camara_activa == 1:
                    self.canvas1.create_image(0, 0, anchor=tk.NW, image=imgtk)
                    self.canvas1.imgtk = imgtk
                else:
                    self.canvas2.create_image(0, 0, anchor=tk.NW, image=imgtk)
                    self.canvas2.imgtk = imgtk
                
                # Llamar de nuevo después de 10ms
                self.root.after(10, self.actualizar_video)
    
    def capturar_foto(self, numero):
        if self.cap is not None and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                # Guardar imagen capturada
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                if numero == 1:
                    self.imagen1 = frame_rgb
                    messagebox.showinfo("Éxito", "Foto de Persona 1 capturada correctamente")
                else:
                    self.imagen2 = frame_rgb
                    messagebox.showinfo("Éxito", "Foto de Persona 2 capturada correctamente")
                
                # Cerrar cámara después de capturar
                self.cerrar_camara()
                
                # Habilitar botón de comparar si ambas fotos están capturadas
                if self.imagen1 is not None and self.imagen2 is not None:
                    self.btn_comparar.config(state=tk.NORMAL)
    
    def imagen_a_bytes(self, imagen):
        """Convierte una imagen numpy array a bytes para AWS"""
        img_pil = Image.fromarray(imagen)
        buffer = io.BytesIO()
        img_pil.save(buffer, format='JPEG')
        return buffer.getvalue()
    
    def comparar_rostros(self):
        if self.imagen1 is None or self.imagen2 is None:
            messagebox.showwarning("Advertencia", "Debe capturar ambas fotos primero")
            return
        
        try:
            # Actualizar texto
            self.text_resultados.config(state=tk.NORMAL)
            self.text_resultados.delete("1.0", tk.END)
            self.text_resultados.insert("1.0", "Analizando rostros con AWS Rekognition...\n\n")
            self.text_resultados.config(state=tk.DISABLED)
            self.root.update()
            
            # Convertir imágenes a bytes
            img1_bytes = self.imagen_a_bytes(self.imagen1)
            img2_bytes = self.imagen_a_bytes(self.imagen2)
            
            # Llamar a AWS Rekognition
            response = self.rekognition_client.compare_faces(
                SourceImage={'Bytes': img1_bytes},
                TargetImage={'Bytes': img2_bytes},
                SimilarityThreshold=0
            )
            
            # Procesar resultados
            self.mostrar_resultados(response)
            
        except Exception as e:
            messagebox.showerror("Error", f"Error al comparar rostros:\n{str(e)}")
    
    def mostrar_resultados(self, response):
        self.text_resultados.config(state=tk.NORMAL)
        self.text_resultados.delete("1.0", tk.END)
        
        resultado = ""
        resultado += "═══════════════════════════════════════════\n"
        resultado += "   RESULTADOS DE COMPARACIÓN FACIAL\n"
        resultado += "═══════════════════════════════════════════\n\n"
        
        if response['FaceMatches']:
            match = response['FaceMatches'][0]
            similarity = match['Similarity']
            
            resultado += f"✅ ROSTROS DETECTADOS Y COMPARADOS\n\n"
            resultado += f"🎯 SIMILITUD: {similarity:.2f}%\n\n"
            
            # Interpretación
            if similarity >= 90:
                resultado += "🟢 RESULTADO: ES LA MISMA PERSONA\n"
                resultado += "   Alta probabilidad de coincidencia\n\n"
            elif similarity >= 70:
                resultado += "🟡 RESULTADO: POSIBLE COINCIDENCIA\n"
                resultado += "   Similitud moderada detectada\n\n"
            else:
                resultado += "🔴 RESULTADO: PERSONAS DIFERENTES\n"
                resultado += "   Baja similitud detectada\n\n"
            
            # Detalles del rostro coincidente
            face = match['Face']
            resultado += "─── DETALLES DEL ANÁLISIS ───\n\n"
            resultado += f"Confianza de detección: {face['Confidence']:.2f}%\n"
            
            # Posición del rostro
            bbox = face['BoundingBox']
            resultado += f"\nPosición del rostro en Imagen 2:\n"
            resultado += f"  • Ancho: {bbox['Width']*100:.1f}%\n"
            resultado += f"  • Alto: {bbox['Height']*100:.1f}%\n"
            resultado += f"  • Izquierda: {bbox['Left']*100:.1f}%\n"
            resultado += f"  • Superior: {bbox['Top']*100:.1f}%\n"
            
            # Calidad del rostro
            if 'Quality' in face:
                quality = face['Quality']
                resultado += f"\nCalidad de la imagen:\n"
                resultado += f"  • Brillo: {quality.get('Brightness', 0):.2f}\n"
                resultado += f"  • Nitidez: {quality.get('Sharpness', 0):.2f}\n"
            
        else:
            resultado += "❌ NO SE ENCONTRÓ COINCIDENCIA\n\n"
            resultado += "Posibles razones:\n"
            resultado += "• Los rostros son de personas diferentes\n"
            resultado += "• La calidad de las imágenes es baja\n"
            resultado += "• No se detectó un rostro en alguna imagen\n"
            resultado += "• La iluminación es insuficiente\n\n"
        
        # Información adicional
        if 'UnmatchedFaces' in response and response['UnmatchedFaces']:
            resultado += f"\n⚠️  Rostros no coincidentes detectados: {len(response['UnmatchedFaces'])}\n"
        
        resultado += "\n═══════════════════════════════════════════\n"
        resultado += f"Análisis completado exitosamente\n"
        resultado += "═══════════════════════════════════════════\n"
        
        self.text_resultados.insert("1.0", resultado)
        self.text_resultados.config(state=tk.DISABLED)
    
    def limpiar_todo(self):
        # Cerrar cámara si está abierta
        self.cerrar_camara()
        
        # Limpiar imágenes
        self.imagen1 = None
        self.imagen2 = None
        
        # Limpiar canvas
        self.canvas1.delete("all")
        self.canvas2.delete("all")
        
        # Resetear texto
        self.text_resultados.config(state=tk.NORMAL)
        self.text_resultados.delete("1.0", tk.END)
        self.text_resultados.insert("1.0", 
            "═══════════════════════════════════════════\n"
            "   SISTEMA DE COMPARACIÓN FACIAL\n"
            "   Powered by AWS Rekognition\n"
            "═══════════════════════════════════════════\n\n"
            "Todo limpio. Listo para nuevas capturas.\n"
        )
        self.text_resultados.config(state=tk.DISABLED)
        
        # Deshabilitar botón de comparar
        self.btn_comparar.config(state=tk.DISABLED)
        
    def __del__(self):
        if self.cap is not None:
            self.cap.release()

if __name__ == "__main__":
    root = tk.Tk()
    app = ComparacionFacialApp(root)
    root.mainloop()
