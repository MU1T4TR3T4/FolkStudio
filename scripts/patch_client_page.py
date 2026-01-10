
import os

file_path = r'c:\Users\Administrador\Desktop\FolkStudio\src\app\dashboard\clientes\[id]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The target block to replace (simplified matching)
target_start = 'bg-black/40'
target_end = 'Pedir'
# We look for the block containing 'Pedir' inside the overlay div

# Construct new content
new_block = """                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center p-3">
                                                    <div className="flex gap-2 w-full">
                                                        <Button 
                                                            size="sm" 
                                                            variant="secondary"
                                                            onClick={() => setViewImage_url(imgUrl || null)} 
                                                            className="flex-1 bg-white/90 hover:bg-white text-gray-900 border-0 h-8"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {item.approval_token && item.approval_status !== 'approved' && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="secondary"
                                                                onClick={() => handleCopyApprovalLink(item.approval_token)}
                                                                data-test-token={item.approval_token}
                                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-0 h-8"
                                                            >
                                                                <LinkIcon className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Button size="sm" onClick={() => handleOrderFromStamp(item)} className="w-full bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg font-medium tracking-wide h-8">
                                                        Pedir
                                                    </Button>
                                                </div>"""

# Find the location
# We'll look for the specific existing block structure to replace it safely
# Existing:
# <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
#     <Button ...>
#         Pedir
#     </Button>
# </div>

# We can try to match by splitting and finding the parts
parts = content.split('<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">')

if len(parts) > 1:
    # Found the start
    pre = parts[0]
    remainder = parts[1]
    
    # Find the end of the div
    # It contains the button and closing div
    # We know the specific structure
    # <Button ...> ... Pedir ... </Button> ... </div>
    
    subparts = remainder.split('</div>', 1) # Split on first closing div which closes the overlay
    if len(subparts) > 1:
        post = subparts[1]
        
        # Reassemble
        new_content = pre + new_block + post
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully patched file.")
    else:
        print("Could not find closing div.")
else:
    print("Could not find start of block.")
