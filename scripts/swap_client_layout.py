
import os
import re

file_path = r'c:\Users\Administrador\Desktop\FolkStudio\src\app\dashboard\clientes\[id]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find two blocks:
# 1. Assigned Stamps Block
# Starts with: {clientStamps.length > 0 && (
# Ends with the closing brace before <div className="flex items-center justify-between"> (which starts the Order History)

# 2. Order History Block
# Starts with: <div className="flex items-center justify-between">
# Ends with the closing div of the right column container.

# Let's verify the structure by looking for unique markers across the file.

# Marker 1: Start of Assigned Stamps
# It is inside the right column: <div className="lg:col-span-2 space-y-6">
# Content: {clientStamps.length > 0 && (

# Marker 2: Start of Order History (which is currently AFTER stamps)
# <div className="flex items-center justify-between">
#     <h2 ... > ... Histórico de Pedidos ... </h2>

# We want to put Order History FIRST, then Assigned Stamps.

# Step 1: Extract the full Assigned Stamps block.
# Since it's wrapped in {clientStamps.length > 0 && ( ... )}, we can try to find this block.
# However, regex balancing is hard.
# Let's rely on the fact that they are sequential in the file.

# We can split the file into 3 parts:
# Part A: Everything before Assigned Stamps
# Part B: Assigned Stamps Block
# Part C: Order History Block (and everything after it inside the parent div, or just the block itself?)

# Actually, the Order History block is not wrapped in a condition (only parts of it are).
# But the "Assigned Stamps" IS wrapped.

# Regex to find Assigned Stamps block:
# Matches `{clientStamps.length > 0 && (` until the line before `<div className="flex items-center justify-between">`
# This relies on the specific spacing I saw in view_file.

# Let's use a simpler approach:
# Find the start index of Assigned Stamps: `{clientStamps.length > 0 && (`
# Find the start index of Order History: `<div className="flex items-center justify-between">`
# The text between these two indices is the Assigned Stamps block (plus some whitespace).

start_stamps_marker = '{clientStamps.length > 0 && ('
start_orders_marker = '<div className="flex items-center justify-between">'
header_orders_text = 'Histórico de Pedidos' # to be sure we have the right div

idx_stamps = content.find(start_stamps_marker)
idx_orders = content.find(start_orders_marker)

if idx_stamps == -1 or idx_orders == -1:
    print("Could not find markers.")
    exit(1)

if idx_stamps > idx_orders:
    print("Stamps are already after orders? or logic is wrong.")
    # If stamps are already after, maybe we don't need to do anything, or my assumption about file state is wrong.
    # But user says they want to move it.
    # Let's check if there is another occurrence?
    pass

# Extract the stamps block
# It goes from idx_stamps UP TO idx_orders.
stamps_block = content[idx_stamps:idx_orders]

# Removing whitespace at the end of stamps_block might be needed to keep clean
stamps_block = stamps_block.rstrip()

# Now we need to define the End of Order History.
# This is tricky because it ends at the end of the parent div.
# But wait, looking at the code:
# The right column is: <div className="lg:col-span-2 space-y-6">
# Then Stamps are mapped.
# Then Orders are mapped.
# Then closing </div> for col-span-2.

# So the Order History block goes from idx_orders up to the last </div> before the closing of the component return?
# Or we can just just append the stamps block to the END of the content inside that parent div?

# Let's identify the parent container closing.
# The parent started at: <div className="lg:col-span-2 space-y-6">
parent_start = '<div className="lg:col-span-2 space-y-6">'
idx_parent = content.find(parent_start)

# Finding the closing div of this parent is hard without parsing.
# But we can try to find the transition point.

# Plan:
# 1. Remove stamps_block from its current position.
# 2. Insert stamps_block AFTER the Order History block.
# Where does Order History block end?
# It ends where the parent div ends.
# The parent div content is: [Stamps Block] [Orders Block]
# If we remove [Stamps Block], we are left with [Orders Block].
# So we effectively just want to Move [Stamps Block] to the end of [Orders Block].

# Finding the end of the Order History block:
# It seems to end with the closing of the else block of {clientOrders.length === 0 ? ... : ...}
# Reference code:
# ...
#     )}
# </div>  <-- End of right column

# So we can look for the closing tag of the right column.
# Use indentation as a hint? 
# The file has:
#                 {/* Right Column: Orders & History */}
#                 <div className="lg:col-span-2 space-y-6">
# 
#                     {/* Assigned Stamps Section */}
#                     {clientStamps.length > 0 && (
# ...
#                     )}
#                     <div className="flex items-center justify-between">
# ...
#                     </div>
# 
#                     {clientOrders.length === 0 ? (
# ...
#                     ) : (
# ...
#                     )}
#                 </div>

# So valid structure is:
# [Stamps Block]
# [Orders Header]
# [Orders List Logic]
# [Closing Div of Column]

# So if we extract [Stamps Block], the rest is [Orders Header] + [Orders List Logic].
# We need to insert [Stamps Block] right before [Closing Div of Column].

# Let's locate [Closing Div of Column].
# It is the </div> that matches the indentation of <div className="lg:col-span-2 space-y-6">.
# In the `view_file` output, typical indentation is 16 spaces for column start?
# Line 307:                 <div className="lg:col-span-2 space-y-6"> (16 spaces)
# Line 437:                 </div> (16 spaces)
# followed by:             </div> (12 spaces)
# followed by: 
#             <ClientModal

# So we look for the last `                </div>` before `<ClientModal`.

client_modal_marker = '<ClientModal'
idx_modal = content.find(client_modal_marker)

# Search backwards from idx_modal for `                </div>`
# It should be the first </div> when searching backwards.
last_div_idx = content.rfind('</div>', 0, idx_modal)

# Check indentation?
# Actually any </div> before ClientModal is likely the one, provided it's the right nested level.
# But let's be safer.
# If we assume usage of `                </div>` (16 spaces), we can find it.

# Let's do the remove and insert.

# 1. Extract and Remove stamps block
# markers: start_stamps_marker, start_orders_marker
stamps_block = content[idx_stamps:idx_orders]
# new content without stamps:
content_without_stamps = content[:idx_stamps] + content[idx_orders:]

# 2. Insert stamps block at the end of the column.
# We need to find the new insertion point in `content_without_stamps`.
# The insertion point is right before the closing div of the column.
# Markers: 
# The column started at `parent_start`.
# The column ends before `client_modal_marker`.
# We need to look for the last </div> before `client_modal_marker`.

idx_modal_new = content_without_stamps.find(client_modal_marker)
last_div_idx_new = content_without_stamps.rfind('</div>', 0, idx_modal_new)
# We want to verify this is the right div. It's the one closing "lg:col-span-2".
# Code structure:
#    </div> (Right Column)
# </div> (Grid)
# <ClientModal ...

# So we actually need the SECOND to last div before ClientModal?
# Line 436:                 </div>  (Right Column)
# Line 437:             </div>      (Grid)

# Let's check regex for `</div>\s*</div>\s*<ClientModal`
match = re.search(r'(</div>\s*</div>\s*<ClientModal)', content_without_stamps)
if match:
    # Found the end of the grid.
    # The end of the column is the first </div> in that group.
    # actually, we can just insert before the match.start() + (length of first div?)
    # Easier: Insert before the match, but that would put it outside the column? 
    # No, that matches </div> (col) </div> (grid).
    # So if we insert before that match, we are inserting INSIDE the column? No.
    # content: ... content ... </div></div><ClientModal
    # If we insert before match start, we are inserting before </div></div>.
    # So ... content ... [INSERT] </div></div>.
    # Yes! That puts it inside the column (before the column closes).
    
    # Wait, `</div>` closes the column.
    # So if we insert before `</div></div>`, we are effectively inserting before the column closes.
    # Correct.
    
    insert_pos = match.start()
    
    # Add some spacing / newlines
    new_stamps_block = '\n\n                    {/* Assigned Stamps Section (Moved) */}\n' + stamps_block.strip() + '\n'
    
    final_content = content_without_stamps[:insert_pos] + new_stamps_block + content_without_stamps[insert_pos:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("Successfully swapped blocks.")
    
else:
    print("Could not find insertion point.")

