import requests
import os

berry_names = ['Cheri', 'Chesto','Pecha','Rawst','Aspear','Leppa','Oran','Persim','Lum',
'Sitrus','Figy', 'Wiki', 'Mago', 'Aguav','Iapapa','Razz', 'Bluk', 'Nanab','Wepear','Pinap',
'Pomeg','Kelpsy','Qualot','Hondew','Grepa','Tamato','Cornn','Magost','Rabuta','Nomel',
'Spelon','Pamtre','Watmel','Durin','Belue','Occa', 'Passho','Wacan','Rindo','Yache','Chople',
'Kebia','Shuca','Coba', 'Payapa','Tanga','Charti','Kasib','Haban','Colbur','Babiri','Chilan',
'Liechi','Ganlon','Salac','Petaya','Apicot','Lansat','Starf','Enigma','Micle','Custap','Jaboca','Rowap']

def make_folder(berry_name:str):
  dir_path = os.path.abspath(os.getcwd()) + "/berry_pull/" + berry_name
  print(dir_path)
  os.makedirs(dir_path)

def download_img(berry_name, tree_type):
  page_url = f"https://bulbapedia.bulbagarden.net/wiki/File:{berry_name}Tree{tree_type}.png"
  response = requests.get(page_url)
  partition = response.text.partition("//archives.bulbagarden.net/media/upload/")
  #3/37/ChestoTreeTaller.png
  after = partition[2].partition('"')[0]
  img_response = requests.get(f"https://archives.bulbagarden.net/media/upload/{after}")
  
  with open(f"berry_pull/{berry_name}/{berry_name}Tree{tree_type}.png", "wb") as f:
    f.write(img_response.content)

def download_berries(berry_names):
  print("Downloading...")
  for berry in berry_names:
    print(berry)
    make_folder(berry)
    for tree_type in ["Taller", "Bloom", "Berry"]:
      print(f"{berry}Tree{tree_type}.png")
      download_img(berry, tree_type)
  
  print("done")

# make_folder("Cheri")
# download_img("Cheri", "Taller")
download_berries(berry_names)