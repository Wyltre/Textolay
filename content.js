(function() {
  
  let pageLoaded = true;
  
  // Düzeltilmiş metin için global değişken
  let lastCorrectedText = null;
  
  // XenForo'nun draft ve otomatik kaydetme sistemini izle
  setupXenForoInterceptors();
  
  function replaceCorrectionButtons() {
   
    const duzeltButtons = document.querySelectorAll('button[data-xf-init="duzelt"]');
    
    duzeltButtons.forEach(button => {
   
      if (!button.classList.contains('ai-modified')) {
       
        const originalIcon = button.querySelector('i.fa--xf');
        const originalText = button.querySelector('.button-text');
        
       
        button.classList.add('ai-modified');
        
        
        const originalClickListeners = button.getEventListeners && button.getEventListeners('click');
        button.replaceWith(button.cloneNode(true));
       
        const newButton = document.querySelector('button[data-xf-init="duzelt"].ai-modified');
        
        if (originalText) {
          originalText.textContent = 'AI ile Düzelt';
        }
        
       
        newButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
        
          const editor = findEditorElement();
          if (editor) {
            const text = getEditorText(editor);
            correctTextWithGemini(text, editor, newButton);
          } else {
            showNotification('Düzeltilebilecek bir metin alanı bulunamadı', 'error');
          }
        });
      }
    });
  }
  
    function findEditorElement() {
        const xfEditor = getXenForoEditor();
    if (xfEditor) {
      console.log('XenForo editör bulundu');
      return xfEditor.ed.getEl();
    }
    
        const editorSelectors = [
      'textarea.input.js-editor[data-xf-init="editor"]',  
      '.fr-element.fr-view',                             
      '.fr-box textarea',                                 
      '.fr-box .fr-element',                              
      'div[contenteditable="true"].fr-element',           
      '.message-editorWrapper textarea',                 
      '[contenteditable="true"]',                         
      'textarea.input'                                    
    ];
    
        let mainEditor = null;
    
    for (const selector of editorSelectors) {
      const editor = document.querySelector(selector);
      if (editor) {
        console.log('Editor bulundu:', selector, editor);
        
                if (selector.includes('fr-') || editor.closest('.fr-box')) {
          console.log('Froala editör tespit edildi');
          
                    if (typeof FroalaEditor !== 'undefined' && FroalaEditor.INSTANCES && FroalaEditor.INSTANCES.length > 0) {
            console.log('Froala API bulundu, instance sayısı:', FroalaEditor.INSTANCES.length);
          }
        }
        
        mainEditor = editor;
        break;
      }
    }
    
    if (!mainEditor) {
      console.log('Editor bulunamadı');
    }
    
    return mainEditor;
  }
  
    function getXenForoEditor() {
    try {
            if (typeof XF !== 'undefined') {
                if (XF.Editor && XF.Editor.instance) {
          const editorInstance = XF.Editor.instance;
          console.log('XF.Editor instance bulundu');
          return editorInstance;
        }
        
                if (XF.editorManager && XF.editorManager.editors && XF.editorManager.editors.length > 0) {
          console.log('XF.editorManager bulundu, editör sayısı:', XF.editorManager.editors.length);
          return XF.editorManager.editors[0];
        }
      }
    } catch (e) {
      console.log('XenForo editör bulunamadı:', e);
    }
    
    return null;
  }
  
    function getEditorText(editor) {
    if (!editor) return '';
    
    if (editor.tagName === 'TEXTAREA') {
            return editor.value;
    } else {
            return editor.innerText || editor.textContent;
    }
  }
  
    function updateEditorContent(editor, text) {
    if (!editor) return;
    
        const xfEditor = getXenForoEditor();
    if (xfEditor) {
            updateXenForoContent(xfEditor, text);
      return;
    }
    
        const froalaInstance = getFroalaInstance();
    if (froalaInstance) {
            updateFroalaContent(froalaInstance, text);
      return;
    }
    
    if (editor.tagName === 'TEXTAREA') {
            editor.value = text;
      
            const froalaElement = document.querySelector('.fr-element.fr-view');
      if (froalaElement) {
                let htmlContent = convertTextToHtml(text);
        froalaElement.innerHTML = htmlContent;
        
                try {
          const froalaInstance = FroalaEditor.INSTANCES && FroalaEditor.INSTANCES[0];
          if (froalaInstance) {
            froalaInstance.html.set(htmlContent);
            froalaInstance.undo.saveStep();
          }
        } catch(e) {
          console.log('Froala editör güncellenemedi:', e);
        }
      }
      
                  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      editor.dispatchEvent(inputEvent);
      
            const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      editor.dispatchEvent(changeEvent);
      
            const keyupEvent = new Event('keyup', { bubbles: true, cancelable: true });
      editor.dispatchEvent(keyupEvent);
    } else {
            let htmlContent = convertTextToHtml(text);
      editor.innerHTML = htmlContent;
      
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      editor.dispatchEvent(inputEvent);
    }
  }
  
    function updateXenForoContent(xfEditor, text) {
    try {
      console.log('XenForo API ile içerik güncelleniyor');
      
      let updated = false;
      
      // XF editör nesnesini doğrudan değiştir
      if (typeof XF !== 'undefined' && XF.getEditorInContainer) {
        try {
          const containers = document.querySelectorAll('.js-editor');
          containers.forEach(container => {
            try {
              const editor = XF.getEditorInContainer(container);
              if (editor) {
                console.log('XF.getEditorInContainer ile editör bulundu');
                if (editor.val && typeof editor.val === 'function') {
                  editor.val(text);
                  console.log('XF editor.val() ile içerik güncellendi');
                  updated = true;
                }
              }
            } catch (e) {
              console.log('XF.getEditorInContainer hatası:', e);
            }
          });
        } catch (e) {
          console.log('XF.getEditorInContainer genel hatası:', e);
        }
      }
      
      // XF.Editor.val metodu
      if (!updated && xfEditor.ed && typeof xfEditor.ed.val === 'function') {
        xfEditor.ed.val(text);
        console.log('XF.Editor.val metodu ile içerik güncellendi');
        updated = true;
      } 
      // XF.Editor.setValue metodu
      else if (!updated && xfEditor.setValue && typeof xfEditor.setValue === 'function') {
        xfEditor.setValue(text);
        console.log('XF.Editor.setValue metodu ile içerik güncellendi');
        updated = true;
      } 
      // XF.Editor.setContent metodu
      else if (!updated && xfEditor.setContent && typeof xfEditor.setContent === 'function') {
        xfEditor.setContent(text);
        console.log('XF.Editor.setContent metodu ile içerik güncellendi');
        updated = true;
      } 
      // Manuel güncelleme
      else if (!updated) {
        const editorEl = xfEditor.ed && xfEditor.ed.getEl ? xfEditor.ed.getEl() : null;
        if (editorEl) {
          if (editorEl.tagName === 'TEXTAREA') {
            editorEl.value = text;
          } else {
            editorEl.innerHTML = convertTextToHtml(text);
          }
          console.log('XF editör elementi manuel güncellendi');
          updated = true;
        } else {
          console.warn('XF editör elementi bulunamadı');
        }
      }
      
      // XF editör olaylarını tetikle
      if (xfEditor.ed) {
        // triggerEvent metodu
        if (typeof xfEditor.ed.triggerEvent === 'function') {
          xfEditor.ed.triggerEvent('input');
          xfEditor.ed.triggerEvent('change');
          console.log('XF editör olayları tetiklendi (triggerEvent)');
        }
        
        // trigger metodu
        if (typeof xfEditor.ed.trigger === 'function') {
          xfEditor.ed.trigger('input');
          xfEditor.ed.trigger('change');
          console.log('XF editör olayları tetiklendi (trigger)');
        }
        
        // jQuery trigger
        if (xfEditor.ed.$el && typeof xfEditor.ed.$el.trigger === 'function') {
          xfEditor.ed.$el.trigger('input').trigger('change');
          console.log('XF editör olayları tetiklendi (jQuery trigger)');
        }
      }
      
      // XenForo'nun draft sistemini güncelle
      try {
        // XF.DraftSaver nesnesini bul
        if (typeof XF !== 'undefined' && XF.DraftSaver) {
          // Aktif draft kaydedicileri bul
          const draftSavers = XF.DraftSaver.getAll();
          if (draftSavers && draftSavers.length > 0) {
            console.log('XF.DraftSaver bulundu, sayısı:', draftSavers.length);
            
            // Her bir draft kaydediciyi güncelle
            draftSavers.forEach(draftSaver => {
              try {
                // Draft'ı güncelle
                if (draftSaver.getDraft) {
                  const draft = draftSaver.getDraft();
                  if (draft && draft.message) {
                    draft.message = text;
                  }
                }
                
                // Draft'ı kaydet
                if (draftSaver.save && typeof draftSaver.save === 'function') {
                  draftSaver.save();
                  console.log('XF.DraftSaver.save() çağrıldı');
                }
              } catch (e) {
                console.log('DraftSaver güncelleme hatası:', e);
              }
            });
          }
        }
        
        // XF.FormInputValidation nesnesini sıfırla
        if (typeof XF !== 'undefined' && XF.FormInputValidation) {
          const validators = document.querySelectorAll('.js-editor[data-xf-validate]');
          validators.forEach(validator => {
            try {
              const $validator = $(validator);
              if ($validator.length && $validator.data('xf-validate')) {
                $validator.trigger('validate:reset');
                console.log('XF form doğrulama sıfırlandı');
              }
            } catch (e) {
              console.log('Form doğrulama sıfırlama hatası:', e);
            }
          });
        }
      } catch (e) {
        console.log('XF draft sistemi güncelleme hatası:', e);
      }
      
      // XF.FormSubmitRow nesnesini güncelle
      try {
        if (typeof XF !== 'undefined' && XF.FormSubmitRow) {
          const submitRows = XF.FormSubmitRow.getAll();
          if (submitRows && submitRows.length > 0) {
            submitRows.forEach(row => {
              if (row.checkComplete && typeof row.checkComplete === 'function') {
                row.checkComplete();
                console.log('XF.FormSubmitRow.checkComplete() çağrıldı');
              }
            });
          }
        }
      } catch (e) {
        console.log('XF.FormSubmitRow güncelleme hatası:', e);
      }
      
      // XF.EditorManager ile tüm editörleri güncelle
      try {
        if (typeof XF !== 'undefined' && XF.EditorManager && XF.EditorManager.editors) {
          XF.EditorManager.editors.forEach(editor => {
            try {
              if (editor.val && typeof editor.val === 'function') {
                editor.val(text);
                console.log('XF.EditorManager.editors.val() çağrıldı');
              }
            } catch (e) {
              console.log('XF.EditorManager editör güncelleme hatası:', e);
            }
          });
        }
      } catch (e) {
        console.log('XF.EditorManager güncelleme hatası:', e);
      }
      
      return updated;
    } catch (e) {
      console.error('XenForo içeriği güncellenirken hata:', e);
      return false;
    }
  }
  
    function getFroalaInstance() {
    try {
            if (typeof FroalaEditor !== 'undefined' && FroalaEditor.INSTANCES && FroalaEditor.INSTANCES.length > 0) {
        console.log('Froala instance bulundu');
        return FroalaEditor.INSTANCES[0];
      }
      
            if (typeof XF !== 'undefined' && XF.FroalaEditor && XF.FroalaEditor.INSTANCES && XF.FroalaEditor.INSTANCES.length > 0) {
        console.log('XF.FroalaEditor instance bulundu');
        return XF.FroalaEditor.INSTANCES[0];
      }
      
            if (typeof $ !== 'undefined' && $.FroalaEditor && $.FroalaEditor.INSTANCES && $.FroalaEditor.INSTANCES.length > 0) {
        console.log('jQuery.FroalaEditor instance bulundu');
        return $.FroalaEditor.INSTANCES[0];
      }
    } catch (e) {
      console.log('Froala instance bulunamadı:', e);
    }
    
    return null;
  }
  
    function updateFroalaContent(froalaInstance, text) {
    try {
      console.log('Froala API ile içerik güncelleniyor');
      
      // HTML içeriğine dönüştür
      let htmlContent = convertTextToHtml(text);
      let updated = false;
      
      // 1. Doğrudan Froala editör DOM elementlerini güncelle
      const froalaElements = document.querySelectorAll('.fr-element.fr-view');
      if (froalaElements.length > 0) {
        froalaElements.forEach(el => {
          el.innerHTML = htmlContent;
          console.log('Froala editör DOM elementi güncellendi');
          
          // Olay tetikleme
          ['input', 'change', 'blur'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            el.dispatchEvent(event);
          });
        });
        updated = true;
      }
      
      // 2. Froala API metodlarını kullan
      if (froalaInstance.html && typeof froalaInstance.html.set === 'function') {
        // HTML içeriğini ayarla
        froalaInstance.html.set(htmlContent);
        console.log('froalaInstance.html.set() çağrıldı');
        
        // Değişiklikleri kaydet
        if (froalaInstance.undo && typeof froalaInstance.undo.saveStep === 'function') {
          froalaInstance.undo.saveStep();
          console.log('froalaInstance.undo.saveStep() çağrıldı');
        }
        
        // Editör içeriğini güncelledikten sonra değişiklik olayını tetikle
        if (froalaInstance.events && typeof froalaInstance.events.trigger === 'function') {
          froalaInstance.events.trigger('contentChanged');
          froalaInstance.events.trigger('input');
          froalaInstance.events.trigger('change');
          console.log('Froala olayları tetiklendi');
        }
        
        updated = true;
      } else {
        console.warn('Froala html.set metodu bulunamadı');
      }
      
      // 3. XenForo'nun Froala entegrasyonu için özel işlemler
      try {
        // XF.Editor.Froala sınıfını kontrol et
        if (typeof XF !== 'undefined' && XF.Editor && XF.Editor.Froala) {
          // XF.Editor.Froala instance'larını bul
          const xfEditors = [];
          
          // XF.editorManager üzerinden editörleri bul
          if (XF.editorManager && XF.editorManager.editors) {
            XF.editorManager.editors.forEach(editor => {
              if (editor.ed && editor.ed.$el) {
                xfEditors.push(editor);
              }
            });
          }
          
          if (xfEditors.length > 0) {
            console.log('XF.Editor.Froala instance bulundu, sayısı:', xfEditors.length);
            
            // Her bir editörü güncelle
            xfEditors.forEach(editor => {
              try {
                // Editör içeriğini güncelle
                if (editor.ed && editor.ed.html && typeof editor.ed.html.set === 'function') {
                  editor.ed.html.set(htmlContent);
                  console.log('XF.Editor.Froala.html.set() çağrıldı');
                }
                
                // Değişiklik olayını tetikle
                if (editor.ed && editor.ed.events && typeof editor.ed.events.trigger === 'function') {
                  editor.ed.events.trigger('contentChanged');
                  editor.ed.events.trigger('input');
                  editor.ed.events.trigger('change');
                }
                
                // XF editör API'sini kullan
                if (editor.val && typeof editor.val === 'function') {
                  editor.val(text);
                  console.log('XF.Editor.val() çağrıldı');
                }
              } catch (e) {
                console.log('XF.Editor.Froala güncelleme hatası:', e);
              }
            });
            
            updated = true;
          }
        }
      } catch (e) {
        console.log('XF.Editor.Froala entegrasyonu hatası:', e);
      }
      
      // 4. Textarea'ları güncelle
      const textareas = document.querySelectorAll('textarea.js-editor, textarea[data-xf-init="editor"], textarea.fr-code');
      let textareaUpdated = false;
      
      textareas.forEach(textarea => {
        textarea.value = text;
        
        // Değişiklik olaylarını tetikle
        ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          textarea.dispatchEvent(event);
        });
        
        // jQuery varsa jQuery olaylarını da tetikle
        if (typeof $ !== 'undefined') {
          try {
            $(textarea).trigger('input').trigger('change').trigger('keyup');
          } catch (e) {
            console.log('jQuery olay tetikleme hatası:', e);
          }
        }
        
        textareaUpdated = true;
      });
      
      if (textareaUpdated) {
        console.log('Textarea içeriği güncellendi');
        updated = true;
      }
      
      // 5. Global FroalaEditor nesnesini kontrol et ve tüm instance'ları güncelle
      if (typeof FroalaEditor !== 'undefined' && FroalaEditor.INSTANCES) {
        try {
          for (let i = 0; i < FroalaEditor.INSTANCES.length; i++) {
            const instance = FroalaEditor.INSTANCES[i];
            if (instance && instance.html && typeof instance.html.set === 'function') {
              instance.html.set(htmlContent);
              console.log(`FroalaEditor.INSTANCES[${i}].html.set() çağrıldı`);
              
              if (instance.undo && typeof instance.undo.saveStep === 'function') {
                instance.undo.saveStep();
              }
              
              if (instance.events && typeof instance.events.trigger === 'function') {
                instance.events.trigger('contentChanged');
                instance.events.trigger('input');
              }
              
              updated = true;
            }
          }
        } catch (e) {
          console.log('FroalaEditor.INSTANCES güncelleme hatası:', e);
        }
      }
      
      // 6. Draft sistemini güncelle
      updateDraftStorage(text);
      
      if (!updated) {
        console.warn('Hiçbir Froala editör instance\'ı güncellenemedi');
        return false;
      }
      
      console.log('Froala içeriği güncellendi');
      return true;
    } catch (e) {
      console.error('Froala içeriği güncellenirken hata:', e);
      return false;
    }
  }
  
    function updateDraftStorage(text) {
    try {
      console.log('Draft depolama sistemi güncelleniyor');
      
            if (typeof XF !== 'undefined') {
                if (XF.DraftSaver) {
                    const draftSavers = XF.DraftSaver.getAll();
          if (draftSavers && draftSavers.length > 0) {
            console.log('XF.DraftSaver bulundu, sayısı:', draftSavers.length);
            
                        draftSavers.forEach(draftSaver => {
              try {
                                if (draftSaver.getDraft) {
                  const draft = draftSaver.getDraft();
                  if (draft && draft.message) {
                    draft.message = text;
                  }
                }
                
                                if (draftSaver.save && typeof draftSaver.save === 'function') {
                  draftSaver.save();
                  console.log('XF.DraftSaver.save() çağrıldı');
                }
              } catch (e) {
                console.log('DraftSaver güncelleme hatası:', e);
              }
            });
          }
        }
      }
      
            if (typeof localStorage !== 'undefined') {
                const draftKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('draft') || key.includes('editor'))) {
            draftKeys.push(key);
          }
        }
        
                if (draftKeys.length > 0) {
          console.log('LocalStorage draft anahtarları bulundu, sayısı:', draftKeys.length);
          
          draftKeys.forEach(key => {
            try {
              const draftData = JSON.parse(localStorage.getItem(key));
              if (draftData && draftData.message) {
                draftData.message = text;
                localStorage.setItem(key, JSON.stringify(draftData));
                console.log(`LocalStorage draft güncellendi: ${key}`);
              }
            } catch (e) {
              console.log(`Draft güncelleme hatası (${key}):`, e);
            }
          });
        }
      }
      
      console.log('Draft depolama sistemi güncellendi');
      return true;
    } catch (e) {
      console.error('Draft depolama sistemi güncellenirken hata:', e);
      return false;
    }
  }
  
    function forceUpdateEditorContent(editor, text) {
    try {
      console.log('DOM manipülasyonu ile içerik güncelleniyor');
      
      // Düzeltilmiş metni global değişkene kaydet
      lastCorrectedText = text;
      
      // XenForo'nun otomatik kaydetme mekanizmasını devre dışı bırak
      disableXenForoAutoSave();
      
      // XenForo'nun draft sistemini override et
      overrideXenForoDraftSystem(text);
      
      // Editörün tipine göre işlem yap
      if (editor.tagName === 'TEXTAREA') {
        // Textarea içeriğini güncelle
        editor.value = text;
        
        // Olay tetikleme
        ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          editor.dispatchEvent(event);
        });
        
        // jQuery varsa jQuery olaylarını da tetikle
        if (typeof $ !== 'undefined') {
          try {
            $(editor).trigger('input').trigger('change').trigger('keyup');
          } catch (e) {
            console.log('jQuery olay tetikleme hatası:', e);
          }
        }
      } else {
        // HTML içeriğini güncelle
        let htmlContent = convertTextToHtml(text);
        editor.innerHTML = htmlContent;
        
        // Olay tetikleme
        ['input', 'change', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          editor.dispatchEvent(event);
        });
      }
      
      // Froala editör alanlarını bul ve güncelle
      const froalaElements = document.querySelectorAll('.fr-element.fr-view');
      if (froalaElements.length > 0) {
        const htmlContent = convertTextToHtml(text);
        froalaElements.forEach(el => {
          el.innerHTML = htmlContent;
          
          // Olay tetikleme
          const event = new Event('input', { bubbles: true, cancelable: true });
          el.dispatchEvent(event);
        });
      }
      
      // XenForo'nun gizli textarea'larını bul ve güncelle
      const hiddenTextareas = document.querySelectorAll('textarea[name="message"], textarea.js-editor');
      hiddenTextareas.forEach(textarea => {
        if (textarea !== editor) {
          textarea.value = text;
          
          // Olay tetikleme
          ['input', 'change'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            textarea.dispatchEvent(event);
          });
        }
      });
      
      // XenForo'nun metin geri yükleme mekanizmasını devre dışı bırak
      try {
        // XenForo'nun localStorage'daki draft verilerini güncelle
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('draft') || key.includes('editor'))) {
              try {
                const draftData = JSON.parse(localStorage.getItem(key));
                if (draftData && draftData.message) {
                  draftData.message = text;
                  localStorage.setItem(key, JSON.stringify(draftData));
                  console.log(`LocalStorage draft güncellendi: ${key}`);
                }
              } catch (e) {
                console.log(`Draft güncelleme hatası (${key}):`, e);
              }
            }
          }
        }
        
        // XenForo'nun form verilerini güncelle
        if (typeof XF !== 'undefined') {
          // Form elementlerini bul
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
            try {
              // Form verilerini güncelle
              const formData = new FormData(form);
              const messageField = formData.get('message');
              if (messageField) {
                // Form içindeki message alanını güncelle
                const messageInput = form.querySelector('textarea[name="message"]');
                if (messageInput) {
                  messageInput.value = text;
                  
                  // Olay tetikleme
                  ['input', 'change', 'keyup'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    messageInput.dispatchEvent(event);
                  });
                }
              }
            } catch (e) {
              console.log('Form güncelleme hatası:', e);
            }
          });
        }
      } catch (e) {
        console.log('XenForo metin geri yükleme mekanizması devre dışı bırakma hatası:', e);
      }
      
      // XenForo'nun editör konfigürasyonunu güncelle
      try {
        if (typeof XF !== 'undefined' && XF.config && XF.config.editor) {
          // Editör konfigürasyonundaki draft verilerini güncelle
          if (XF.config.editor.draft) {
            XF.config.editor.draft = text;
            console.log('XF.config.editor.draft güncellendi');
          }
        }
      } catch (e) {
        console.log('XF.config.editor güncelleme hatası:', e);
      }
      
      // Tüm MutationObserver'ları geçici olarak durdur
      try {
        if (typeof MutationObserver !== 'undefined') {
          const originalMutationObserver = window.MutationObserver;
          
          // MutationObserver'ı geçici olarak devre dışı bırak
          window.MutationObserver = function(callback) {
            console.log('MutationObserver oluşturma engellendi');
            return {
              observe: function() {},
              disconnect: function() {}
            };
          };
          
          // 5 saniye sonra orijinal MutationObserver'ı geri yükle
          setTimeout(() => {
            window.MutationObserver = originalMutationObserver;
            console.log('MutationObserver geri yüklendi');
          }, 5000);
        }
      } catch (e) {
        console.log('MutationObserver devre dışı bırakma hatası:', e);
      }
      
      // Draft sistemini güncelle
      updateDraftStorage(text);
      
      console.log('DOM manipülasyonu ile içerik güncellendi');
      return true;
    } catch (e) {
      console.error('DOM manipülasyonu ile içerik güncellenirken hata:', e);
      return false;
    }
  }
  
    function convertTextToHtml(text) {
    if (!text || text.trim() === '') return '<p></p>';
    
        const preserveMarkdown = text.includes('#') || text.includes('**') || text.includes('*') || 
                            text.includes('```') || text.includes('---') || text.includes('>') ||
                            text.includes('[') && text.includes('](');
    
    if (preserveMarkdown) {
            const paragraphs = text.split(/\n\n+/);
      return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
            let processed = text.replace(/\n\n+/g, '\n\n__DOUBLE_NEWLINE__\n\n');
    
        const parts = processed.split('__DOUBLE_NEWLINE__');
    
        return parts.map(part => {
      if (!part.trim()) return '';
            return `<p>${part.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }
  
    function correctTextWithGemini(text, editorElement, buttonElement) {
    if (!text || text.trim() === '') {
      showNotification('Düzeltilecek metin bulunamadı', 'error');
      return;
    }
    
    // API anahtarını al
    chrome.storage.sync.get('geminiApiKey', async function(data) {
      if (!data.geminiApiKey) {
        showNotification('Lütfen önce Gemini API anahtarınızı girin', 'warning');
        return;
      }
      
      const apiKey = data.geminiApiKey;
      
      // Buton metnini değiştir
      const buttonText = buttonElement.querySelector('.button-text');
      const originalButtonText = buttonText ? buttonText.textContent : 'AI ile Düzelt';
      if (buttonText) {
        buttonText.textContent = 'Düzeltiliyor...';
      }
      
      // Orijinal metni sakla
      const originalText = text;
      
      try {
        // Düzeltme işlemini başlat
        showNotification('Metin düzeltiliyor...', 'info');
        console.log('Metin düzeltme başlatıldı');
        
        const correctedText = await sendToGeminiAPI(text, apiKey);
        
        if (!correctedText || correctedText.trim() === '') {
          throw new Error('Düzeltilmiş metin boş döndü');
        }
        
        // Düzeltilmiş metni global değişkene kaydet
        lastCorrectedText = correctedText;
        
        console.log('Metin düzeltildi, editöre yerleştiriliyor');
        
        // XenForo'nun otomatik kaydetme mekanizmasını devre dışı bırak
        disableXenForoAutoSave();
        
        // Düzeltilmiş metni editöre yerleştir
        updateEditorContent(editorElement, correctedText);
        
        // Birden fazla deneme ile içeriği güncellemeyi sağla
        let updateAttempts = 0;
        const maxAttempts = 10; // Daha fazla deneme
        const checkInterval = 500; // Daha uzun aralık
        let contentStabilized = false;
        let lastContentCheck = '';
        let stableCount = 0;
        
        const verifyUpdate = function() {
          updateAttempts++;
          const currentText = getEditorText(editorElement);
          
          console.log(`İçerik kontrolü (${updateAttempts}/${maxAttempts})`);
          
          // İçerik stabilize oldu mu kontrol et (aynı içerik art arda 3 kez)
          if (currentText === lastContentCheck) {
            stableCount++;
            console.log(`İçerik stabilizasyon: ${stableCount}/3`);
            if (stableCount >= 3) {
              contentStabilized = true;
            }
          } else {
            stableCount = 0;
            lastContentCheck = currentText;
          }
          
          if (currentText === originalText) {
            console.warn('Editör içeriği güncellenmemiş görünüyor! Tekrar deneniyor...');
            
            // XenForo'nun otomatik kaydetme mekanizmasını devre dışı bırak
            disableXenForoAutoSave();
            
            // Agresif güncelleme dene
            try {
              // Önce forceUpdateEditorContent kullan
              forceUpdateEditorContent(editorElement, correctedText);
              
              // Sonra XenForo ve Froala API'lerini dene
              const xfEditor = getXenForoEditor();
              if (xfEditor) {
                updateXenForoContent(xfEditor, correctedText);
              }
              
              const froalaInstance = getFroalaInstance();
              if (froalaInstance) {
                updateFroalaContent(froalaInstance, correctedText);
              }
            } catch (e) {
              console.error('Agresif güncelleme hatası:', e);
            }
            
            if (updateAttempts < maxAttempts && !contentStabilized) {
              setTimeout(verifyUpdate, checkInterval);
            } else {
              // Son bir deneme daha yap
              try {
                console.log('Son deneme: XenForo editör API ile doğrudan güncelleme');
                
                // XenForo'nun otomatik kaydetme mekanizmasını devre dışı bırak
                disableXenForoAutoSave();
                
                // Tüm olası editör alanlarını güncelle
                updateAllEditorInstances(correctedText);
                
                // XenForo'nun draft sistemini güncelle
                if (typeof XF !== 'undefined') {
                  overrideXenForoDraftSystem(correctedText);
                }
                
                showNotification('Metin düzeltildi, ancak editör güncellemesi için birden fazla deneme yapıldı', 'warning');
              } catch (e) {
                console.error('Son güncelleme denemesi başarısız:', e);
                showNotification('Metin düzeltildi ancak editöre yerleştirilemedi. Lütfen düzeltilmiş metni manuel olarak kopyalayın', 'error');
              }
            }
          } else if (currentText !== correctedText) {
            console.warn('Editör içeriği değişmiş ama düzeltilmiş metin değil! Tekrar deneniyor...');
            
            // XenForo'nun otomatik kaydetme mekanizmasını devre dışı bırak
            disableXenForoAutoSave();
            
            try {
              // Önce forceUpdateEditorContent kullan
              forceUpdateEditorContent(editorElement, correctedText);
              
              // Sonra XenForo ve Froala API'lerini dene
              const xfEditor = getXenForoEditor();
              if (xfEditor) {
                updateXenForoContent(xfEditor, correctedText);
              }
              
              const froalaInstance = getFroalaInstance();
              if (froalaInstance) {
                updateFroalaContent(froalaInstance, correctedText);
              }
              
              // LocalStorage'ı güncelle
              updateDraftStorage(correctedText);
              
              // Tüm textarea ve contenteditable alanlarını güncelle
              document.querySelectorAll('textarea, [contenteditable="true"]').forEach(el => {
                if (el.tagName === 'TEXTAREA') {
                  el.value = correctedText;
                  ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    el.dispatchEvent(event);
                  });
                } else {
                  el.innerHTML = convertTextToHtml(correctedText);
                  ['input', 'change', 'blur'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    el.dispatchEvent(event);
                  });
                }
              });
              
              console.log('Tüm olası editör alanları güncellendi');
            } catch (e) {
              console.error('Agresif güncelleme hatası:', e);
            }
            
            if (updateAttempts < maxAttempts && !contentStabilized) {
              setTimeout(verifyUpdate, checkInterval);
            }
          } else {
            console.log(`Editör içeriği başarıyla güncellendi (${updateAttempts} denemede)`);
            contentStabilized = true;
          }
        };
        
        // İlk kontrol için biraz bekle
        setTimeout(verifyUpdate, checkInterval);
        
        // Buton metnini geri değiştir
        if (buttonText) {
          buttonText.textContent = originalButtonText;
        }
        
        // Başarı mesajı göster
        showNotification('Metin başarıyla düzeltildi!', 'success');
      } catch (error) {
        console.error('Düzeltme hatası:', error);
        
        // Buton metnini geri değiştir
        if (buttonText) {
          buttonText.textContent = originalButtonText;
        }
        
        showNotification('Metin düzeltme sırasında bir hata oluştu: ' + error.message, 'error');
      }
    });
  }
  
    async function sendToGeminiAPI(text, apiKey) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
        const cleanText = text.replace(/<[^>]*>/g, '');
    
        const hasMarkdown = cleanText.includes('#') || cleanText.includes('**') || 
                       cleanText.includes('```') || cleanText.includes('[') && cleanText.includes('](');
    
        const prompt = `Aşağıdaki Türkçe metni yazım kurallarına göre düzelt. İmla hatalarını gider, noktalama işaretlerini düzelt ve daha anlaşılır hale getir.

ÇOK ÖNEMLİ KURALLAR:
1. Metnin orijinal yapısını TAMAMEN koru. Paragraflar ve satır sonları aynen kalmalı.
2. Boş satırları ve boşlukları ASLA silme.
3. Markdown formatını (başlıklar, listeler, linkler, vb.) ASLA değiştirme.
4. Sadece yazım ve dilbilgisi hatalarını düzelt.
5. Metin düzenini değiştirme, sadece yazımı düzelt.
6. Ekstra açıklama ekleme, SADECE düzeltilmiş metni döndür.

İşte düzeltilecek metin:
"""
${cleanText}
"""`;

    const requestData = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "text/plain",
        temperature: 0.05,         topK: 20,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };
    
    try {
      console.log('API isteği gönderiliyor...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
            if (!response.ok) {
        const errorData = await response.json();
        console.error('API hatası:', errorData);
        throw new Error(errorData.error?.message || `API hatası: ${response.status}`);
      }
      
      const data = await response.json();
      
            if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Geçersiz API yanıtı:', data);
        throw new Error('API yanıtı geçersiz format içeriyor');
      }
      
            let result = data.candidates[0].content.parts[0].text;
      
            console.log('API yanıtı alındı, karakter sayısı:', result.length);
      
            result = result.replace(/^"""\s*/g, '').replace(/\s*"""$/g, '');
      
                  const originalLength = cleanText.length;
      const resultLength = result.length;
      const lengthDifference = Math.abs(originalLength - resultLength) / originalLength;
      
      if (lengthDifference > 0.3) {
        console.warn('Düzeltilmiş metin orijinalden çok farklı! Orijinal:', originalLength, 'Düzeltilmiş:', resultLength);
      }
      
      return result;
    } catch (error) {
      console.error('API isteği başarısız oldu:', error);
      throw new Error('API isteği başarısız oldu: ' + error.message);
    }
  }
  
    function showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.textolay-notification');
    existingNotifications.forEach(notification => {
      document.body.removeChild(notification);
    });
    
        const notification = document.createElement('div');
    notification.className = `textolay-notification ${type}`;
    notification.textContent = message;
    
        const styles = {
      padding: '12px 16px',
      margin: '0',
      backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'info' ? '#4f46e5' : '#f59e0b',
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '9999',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: '0',
      transform: 'translateY(10px)',
      maxWidth: '300px'
    };
    
        Object.keys(styles).forEach(key => {
      notification.style[key] = styles[key];
    });
    
        const icon = document.createElement('span');
    icon.style.marginRight = '8px';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    
    if (type === 'success') {
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }
    
    notification.prepend(icon);
    
 
    const closeButton = document.createElement('span');
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeButton.style.marginLeft = '8px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.opacity = '0.7';
    closeButton.style.transition = 'opacity 0.2s';
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.opacity = '1';
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.opacity = '0.7';
    });
    closeButton.addEventListener('click', () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    });
    
    notification.appendChild(closeButton);
    
        document.body.appendChild(notification);
    
        setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
        setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  }
  
    // XenForo'nun otomatik kaydetme mekanizmasını devre dışı bırak
    function disableXenForoAutoSave() {
    try {
      if (typeof XF !== 'undefined') {
        // XF.DraftSaver'ı devre dışı bırak
        if (XF.DraftSaver && XF.DraftSaver.getAll) {
          const draftSavers = XF.DraftSaver.getAll();
          if (draftSavers && draftSavers.length > 0) {
            draftSavers.forEach(draftSaver => {
              try {
                // Auto-save'i devre dışı bırak
                if (draftSaver.interval) {
                  clearInterval(draftSaver.interval);
                  console.log('XF.DraftSaver interval durduruldu');
                }
                
                // Auto-save'i devre dışı bırak (alternatif yöntem)
                if (draftSaver._saveInterval) {
                  clearInterval(draftSaver._saveInterval);
                  console.log('XF.DraftSaver _saveInterval durduruldu');
                }
                
                // Auto-save fonksiyonunu geçici olarak değiştir
                if (draftSaver.save && typeof draftSaver.save === 'function') {
                  const originalSave = draftSaver.save;
                  draftSaver.save = function() {
                    console.log('XF.DraftSaver.save çağrısı engellendi');
                    // Orijinal fonksiyonu 5 saniye sonra geri yükle
                    setTimeout(() => {
                      draftSaver.save = originalSave;
                      console.log('XF.DraftSaver.save fonksiyonu geri yüklendi');
                    }, 5000);
                    return Promise.resolve();
                  };
                  console.log('XF.DraftSaver.save fonksiyonu geçici olarak değiştirildi');
                }
              } catch (e) {
                console.log('DraftSaver devre dışı bırakma hatası:', e);
              }
            });
          }
        }
        
        // XF.AutoCompleter'ı devre dışı bırak
        if (XF.AutoCompleter && XF.AutoCompleter.getAll) {
          const autoCompleters = XF.AutoCompleter.getAll();
          if (autoCompleters && autoCompleters.length > 0) {
            autoCompleters.forEach(completer => {
              try {
                if (completer.hide && typeof completer.hide === 'function') {
                  completer.hide();
                  console.log('XF.AutoCompleter gizlendi');
                }
              } catch (e) {
                console.log('AutoCompleter devre dışı bırakma hatası:', e);
              }
            });
          }
        }
      }
    } catch (e) {
      console.log('XenForo otomatik kaydetme mekanizması devre dışı bırakılamadı:', e);
    }
  }
  
    // XenForo'nun draft sistemini geçersiz kıl
    function overrideXenForoDraftSystem(text) {
    try {
      if (typeof XF !== 'undefined') {
        // XF.DraftSaver'ı override et
        if (XF.DraftSaver && XF.DraftSaver.getAll) {
          const draftSavers = XF.DraftSaver.getAll();
          if (draftSavers && draftSavers.length > 0) {
            draftSavers.forEach(draftSaver => {
              try {
                // getDraft fonksiyonunu override et
                if (draftSaver.getDraft && typeof draftSaver.getDraft === 'function') {
                  const originalGetDraft = draftSaver.getDraft;
                  draftSaver.getDraft = function() {
                    const draft = originalGetDraft.call(this);
                    if (draft && draft.message) {
                      draft.message = text;
                    }
                    return draft;
                  };
                  console.log('XF.DraftSaver.getDraft fonksiyonu override edildi');
                }
                
                // Draft'ı zorla kaydet
                if (draftSaver.save && typeof draftSaver.save === 'function') {
                  draftSaver.save();
                  console.log('XF.DraftSaver.save() çağrıldı (override sonrası)');
                }
              } catch (e) {
                console.log('DraftSaver override hatası:', e);
              }
            });
          }
        }
      }
    } catch (e) {
      console.log('XenForo draft sistemi override hatası:', e);
    }
  }
  
    // Tüm editör instance'larını güncelle
    function updateAllEditorInstances(text) {
    console.log('Tüm editör instance\'ları güncelleniyor...');
    
    // 1. XenForo editörleri
    try {
      if (typeof XF !== 'undefined') {
        // XF.Editor instance'larını güncelle
        if (XF.Editor) {
          if (XF.Editor.instance) {
            updateXenForoContent(XF.Editor.instance, text);
          }
          
          // XF.editorManager üzerinden editörleri güncelle
          if (XF.editorManager && XF.editorManager.editors) {
            XF.editorManager.editors.forEach(editor => {
              updateXenForoContent(editor, text);
            });
          }
        }
      }
    } catch (e) {
      console.log('XenForo editörleri güncelleme hatası:', e);
    }
    
    // 2. Froala editörleri
    try {
      // Global FroalaEditor nesnesini kontrol et
      if (typeof FroalaEditor !== 'undefined' && FroalaEditor.INSTANCES) {
        for (let i = 0; i < FroalaEditor.INSTANCES.length; i++) {
          const instance = FroalaEditor.INSTANCES[i];
          updateFroalaContent(instance, text);
        }
      }
      
      // XF.FroalaEditor nesnesini kontrol et
      if (typeof XF !== 'undefined' && XF.FroalaEditor && XF.FroalaEditor.INSTANCES) {
        for (let i = 0; i < XF.FroalaEditor.INSTANCES.length; i++) {
          const instance = XF.FroalaEditor.INSTANCES[i];
          updateFroalaContent(instance, text);
        }
      }
    } catch (e) {
      console.log('Froala editörleri güncelleme hatası:', e);
    }
    
    // 3. DOM elementlerini güncelle
    try {
      // Textarea'ları güncelle
      document.querySelectorAll('textarea').forEach(textarea => {
        textarea.value = text;
        ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          textarea.dispatchEvent(event);
        });
      });
      
      // Contenteditable alanları güncelle
      document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.innerHTML = convertTextToHtml(text);
        ['input', 'change', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          el.dispatchEvent(event);
        });
      });
    } catch (e) {
      console.log('DOM elementleri güncelleme hatası:', e);
    }
    
    // 4. LocalStorage'ı güncelle
    updateDraftStorage(text);
    
    console.log('Tüm editör instance\'ları güncellendi');
  }
  
    // XenForo'nun draft ve otomatik kaydetme sistemini izle
    function setupXenForoInterceptors() {
    try {
      if (typeof XF !== 'undefined') {
        // XF.DraftSaver'ı izle
        if (XF.DraftSaver) {
          // Orijinal DraftSaver.prototype.save metodunu sakla
          const originalSaveMethod = XF.DraftSaver.prototype.save;
          
          // Save metodunu override et
          XF.DraftSaver.prototype.save = function() {
            try {
              // Eğer düzeltilmiş metin varsa, draft'a ekle
              if (lastCorrectedText) {
                const draft = this.getDraft();
                if (draft && draft.message) {
                  console.log('XF.DraftSaver.prototype.save çağrısı yakalandı, düzeltilmiş metin ekleniyor');
                  draft.message = lastCorrectedText;
                }
              }
            } catch (e) {
              console.log('DraftSaver.save override hatası:', e);
            }
            
            // Orijinal save metodunu çağır
            return originalSaveMethod.apply(this, arguments);
          };
          
          console.log('XF.DraftSaver.prototype.save metodu override edildi');
          
          // Orijinal DraftSaver.prototype.getDraft metodunu sakla
          const originalGetDraftMethod = XF.DraftSaver.prototype.getDraft;
          
          // getDraft metodunu override et
          XF.DraftSaver.prototype.getDraft = function() {
            const draft = originalGetDraftMethod.apply(this, arguments);
            
            // Eğer düzeltilmiş metin varsa, draft'a ekle
            if (lastCorrectedText && draft && draft.message) {
              console.log('XF.DraftSaver.prototype.getDraft çağrısı yakalandı, düzeltilmiş metin ekleniyor');
              draft.message = lastCorrectedText;
            }
            
            return draft;
          };
          
          console.log('XF.DraftSaver.prototype.getDraft metodu override edildi');
        }
        
        // XF.ajax metodunu izle (XenForo'nun AJAX isteklerini yakala)
        if (XF.ajax) {
          const originalAjaxMethod = XF.ajax;
          
          XF.ajax = function(method, url, data, successCallback, errorCallback) {
            // Eğer bu bir draft kaydetme isteği ise ve düzeltilmiş metin varsa
            if (url && url.includes('draft') && data && data.message && lastCorrectedText) {
              console.log('XF.ajax draft isteği yakalandı, düzeltilmiş metin ekleniyor');
              data.message = lastCorrectedText;
            }
            
            // Orijinal ajax metodunu çağır
            return originalAjaxMethod.apply(this, arguments);
          };
          
          console.log('XF.ajax metodu override edildi');
        }
      }
    } catch (e) {
      console.log('XenForo interceptor kurulumu hatası:', e);
    }
  }
  
    replaceCorrectionButtons();
  
    const observer = new MutationObserver(function(mutations) {
    replaceCorrectionButtons();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'correctText') {
            const editor = findEditorElement();
      if (editor) {
        const text = getEditorText(editor);
        
        chrome.storage.sync.get('geminiApiKey', async function(data) {
          if (!data.geminiApiKey) {
            sendResponse({ status: 'error', error: 'API anahtarı bulunamadı' });
            return;
          }
          
          try {
            const correctedText = await sendToGeminiAPI(text, data.geminiApiKey);
            updateEditorContent(editor, correctedText);
            showNotification('Metin başarıyla düzeltildi!', 'success');
            sendResponse({ status: 'success' });
          } catch (error) {
            console.error('API hatası:', error);
            showNotification('Metin düzeltme sırasında bir hata oluştu', 'error');
            sendResponse({ status: 'error', error: error.message });
          }
        });
        
                return true;
      } else {
        sendResponse({ status: 'error', error: 'Editör alanı bulunamadı' });
      }
    } else if (request.action === 'correctSelectedText') {
            const selectedText = request.text;
      if (!selectedText) {
        showNotification('Düzeltilecek metin seçilmedi', 'error');
        return;
      }
      
      const editor = findEditorElement();
      if (!editor) {
        showNotification('Düzeltilecek bir metin alanı bulunamadı', 'error');
        return;
      }
      
      chrome.storage.sync.get('geminiApiKey', async function(data) {
        if (!data.geminiApiKey) {
          showNotification('Lütfen önce Gemini API anahtarınızı girin', 'warning');
          return;
        }
        
        try {
          showNotification('Metin düzeltiliyor...', 'info');
          const correctedText = await sendToGeminiAPI(selectedText, data.geminiApiKey);
          
                    const currentText = getEditorText(editor);
          const newText = currentText.replace(selectedText, correctedText);
          updateEditorContent(editor, newText);
          
          showNotification('Seçili metin başarıyla düzeltildi!', 'success');
        } catch (error) {
          console.error('API hatası:', error);
          showNotification('Metin düzeltme sırasında bir hata oluştu', 'error');
        }
      });
      
      return true;
    } else if (request.action === 'checkPageLoaded') {
      sendResponse({ loaded: pageLoaded });
    }
  });
  
    chrome.runtime.sendMessage({
    action: 'pageLoaded',
    url: window.location.href
  });
})(); 