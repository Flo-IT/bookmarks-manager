import {ipcMain} from "electron";
import {Bookmark, Collection} from "./models";
import {CollectionData, CollectionMinimum} from "../src/helpers/collections";
import {BookmarkData, BookmarkMinimum} from "../src/helpers/bookmarks";

export async function registerBridgeListeners() {

    ipcMain.handle("getBookmarks", async (): Promise<BookmarkData[]> => {
        const bookmarks = await Bookmark.findAll();
        return bookmarks.map(bookmark => bookmark.get())
    })

    ipcMain.handle("addBookmark", async (_event, bookmarkData: BookmarkMinimum | BookmarkData): Promise<BookmarkData> => {
        const bookmark = await Bookmark.create({
            ...bookmarkData
        }, {})
        return bookmark.get();
    })

    ipcMain.handle("updateBookmark", async (_event, id: string, bookmarkData: Partial<CollectionData>): Promise<BookmarkData> => {
        await Bookmark.update({
            ...bookmarkData
        }, {
            where: {id: id}
        })

        const updatedBookmark = await Bookmark.findByPk(id);
        return updatedBookmark?.get();
    })

    ipcMain.handle("removeBookmark", async (_event, id: string): Promise<void> => {
        await Bookmark.destroy({
            where: {id: id}
        })
    })

    ipcMain.handle("getCollections", async (_event): Promise<CollectionData[]> => {
        const collections = await Collection.findAll()
        return collections.map(collection => collection.get())
    })

    ipcMain.handle("addCollection", async (_event, collectionData: CollectionMinimum | CollectionData): Promise<CollectionData> => {
        const collection = await Collection.create({...collectionData})
        return collection.get()
    })

    ipcMain.handle("updateCollection", async (_event, id: string, collectionData: Partial<CollectionData>): Promise<CollectionData> => {
        await Collection.update({
            ...collectionData
        }, {
            where: {id: id}
        })

        const updatedCollection = await Collection.findByPk(id);
        return updatedCollection?.get();
    })

    ipcMain.handle("removeCollection", async (_event, id: string): Promise<void> => {
        await Collection.destroy({
            where: {id: id}
        })
    })

}
