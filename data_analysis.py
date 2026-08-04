import json

def check_soundtrack():
    with open("deltarune_soundtrack.json", "r", encoding="utf-8") as file:
        data = json.load(file)
        list = []
        for info in data:
            list.append(info.get("title"))

        list.sort()

        seen = set()
        duplicates = set()

        for item in list:
            if item in seen:
                duplicates.add(item)
            else:
                seen.add(item)

        print(f"Duplicated songs: {len(duplicates)}")
        if len(duplicates) > 0:
            print(duplicates)

def check_characters():
    with open("deltarune_characters.json", "r", encoding="utf-8") as file:
        data = json.load(file)
        list = []
        for info in data:
            dict = {
                'name': info.get('name'),
                'gender': info.get('gender'),
                'type': info.get('type'),
                'chapter': info.get('chapter'),
                'class': info.get('class'),
                'first_appearance': info.get('first_appearance'),
            }
            list.append(dict)


        with open("out.txt", "w", encoding="utf-8") as out:
            for info in list:
                out.write("========================\n")
                out.write('\n' + info.get('name') + '\n')
                out.write(info.get('gender') + '\n')
                out.write(info.get('type') + '\n')
                out.write(str(info.get('chapter')) + '\n')
                out.write(info.get('class') + '\n')
                out.write(info.get('first_appearance') + '\n')
                out.write("\n========================\n")
            print('Character info inside of out.txt file')


if __name__ == "__main__":
    check_soundtrack()
    check_characters()
