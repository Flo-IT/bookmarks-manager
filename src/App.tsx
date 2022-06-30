import React, {useEffect, useMemo, useState} from "react";
import styled, {ThemeProvider} from "styled-components";
import BookmarkModal, {
    InitialModalBookmark,
    ModalFetchedWebsiteMetadata,
    SavedModalBookmark
} from "./components/BookmarkModal";
import BookmarksLayout from "./components/BookmarksLayout";
import CollectionName from "./components/CollectionName";
import CollectionsBreadCrumb from "./components/CollectionsBreadCrumb";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import {ElectronAPI} from "./helpers/api";
import {BookmarkData, BookmarkMinimum, createDefaultBookmark} from "./helpers/bookmarks";
import {
    COLLECTIONS_SEPARATOR,
    createDefaultCollection,
    TopCollections,
    TreeInputCollection,
    VirtualCollections
} from "./helpers/collections";
import useModal from "./hooks/useModal";
import useCollectionsItems from "./hooks/useCollectionsItems";
import useTree from "./hooks/useTree";
import {GlobalStyle} from "./styles/GlobalStyle";
import {theme} from "./styles/Theme";
import {flatten, slice, uniq} from "lodash";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {DndTypes, IdDroppedItem} from "./helpers/dragAndDrop";


const Layout = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  width: 100%;
  height: 100%;
`

const Main = styled.main`
  overflow-y: auto;
  height: 100%;
  padding: ${props => props.theme.spacing.medium};
`

export const TagsContext = React.createContext<string[]>([]);

const API = new ElectronAPI();


const COLLECTIONS_TREE_ROOTS = [{
    name: TopCollections.TRASH,
    id: TopCollections.TRASH,
    index: -1
}, {
    name: TopCollections.MAIN,
    id: TopCollections.MAIN,
    index: -1
}]

export function App(): JSX.Element {
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(VirtualCollections.ALL);

    const {
        items: bookmarks,
        selectedItems: selectedBookmarks,
        removeItem: removeBookmark,
        updateItem: updateBookmark,
        getItem: getBookmark,
        addItem: addBookmark,
        setItems: setBookmarks
    } = useCollectionsItems<BookmarkData>([], selectedCollectionId);

    const {
        getTreeNodeChildren: getCollectionChildren,
        insertNode: insertCollection,
        getPathToTreeNode: getPathToCollection,
        removeNode: removeCollection,
        updateNode: updateCollection,
        insertNodes: insertCollections,
    } = useTree<TreeInputCollection>({
        rootNodes: COLLECTIONS_TREE_ROOTS,
        leafChildren: bookmarks,
        getKey: (collection) => collection.id,
        getParent: (collection) => collection.parent,
        getLeafChildParent: (bookmark) => bookmark.collection
    })

    const [isEditModalOpen, editModalBookmarkId, openEditModal, closeEditModal] = useModal<string>();
    const [isNewModalOpen, newModalBookmark, openNewModal, closeNewModal] = useModal<BookmarkMinimum & InitialModalBookmark>();

    const allTags = useMemo(() => uniq(flatten(bookmarks.map(bookmark => bookmark.tags))), [bookmarks])
    const selectedCollectionPath = useMemo(() => getPathToCollection(selectedCollectionId), [selectedCollectionId])
    const bookmarksToShow = useMemo(() => {
        if (selectedCollectionId === VirtualCollections.ALL) {
            return bookmarks.filter(bookmark => bookmark.collection !== TopCollections.TRASH);
        }
        return selectedBookmarks;
    }, [bookmarks, selectedBookmarks]);

    useEffect(() => {
        (async () => {
            const fetchedCollections = await API.getCollections()
            insertCollections(fetchedCollections)
            const fetchedBookmarks = await API.getBookmarks()
            setBookmarks(fetchedBookmarks)
        })()
    }, [])

    async function handleAddCollection(name: string) {
        const collectionIndex = getCollectionChildren(selectedCollectionId).length
        const newCollection = createDefaultCollection(name, selectedCollectionPath, collectionIndex)

        const createdCollection = await API.addCollection(newCollection)
        insertCollection(createdCollection)
    }

    async function handleRemoveCollection(id: string, isDefinitiveDelete: boolean) {
        if (isDefinitiveDelete) {
            await API.removeCollection(id)
            removeCollection(id)
        } else {
            const updatedCollection = await API.updateCollection(id, {parent: TopCollections.TRASH})
            updateCollection(id, updatedCollection)

        }
    }

    async function handleRemoveTrashCollection(id: string) {
        await API.removeCollection(id)
        removeCollection(id)
    }

    function handleCollectionSelection(collectionId: string) {
        setSelectedCollectionId(collectionId)
    }

    async function handleDropOnCollection(parentCollectionId: string, droppedItem: IdDroppedItem) {
        if (droppedItem.type === DndTypes.COLLECTION_ITEM) {
            const collectionReorder = await API.reorderCollections(droppedItem.id, parentCollectionId, droppedItem.index)
            collectionReorder.forEach(reorderedCollection => updateCollection(reorderedCollection.id, {
                index: reorderedCollection.index,
                parent: reorderedCollection.parent
            }))

        } else if (droppedItem.type === DndTypes.BOOKMARK_CARD) {
            const updatedBookmark = await API.updateBookmark(droppedItem.id, {collection: parentCollectionId})
            updateBookmark(droppedItem.id, updatedBookmark)
        }
    }

    function canDropOnCollection(parentCollectionId: string, droppedItem: IdDroppedItem) {
        if (droppedItem.type === DndTypes.COLLECTION_ITEM) {
            const parentCollectionPath = getPathToCollection(parentCollectionId).map(collection => collection.id).join(COLLECTIONS_SEPARATOR)
            const collectionPath = getPathToCollection(droppedItem.id).map(collection => collection.id).join(COLLECTIONS_SEPARATOR)

            // Can't drop on itself
            if (parentCollectionPath === collectionPath) return false
            // Can't drop collection inside itself
            if (parentCollectionPath.startsWith(collectionPath)) return false
        }
        return true
    }

    function handleBookmarkCreation() {
        openNewModal(createDefaultBookmark(selectedCollectionPath));
    }

    function handleBookmarkEdit(id: string) {
        openEditModal(id)
    }

    async function handleEditModalSave(data: SavedModalBookmark | undefined) {
        if (!editModalBookmarkId || !data) return

        const updatedBookmark = await API.updateBookmark(editModalBookmarkId, data)
        updateBookmark(editModalBookmarkId, updatedBookmark)

        closeEditModal()
    }

    async function handleNewModalSave(data: BookmarkMinimum & SavedModalBookmark | undefined) {
        if (!data) return

        const createdBookmark = await API.addBookmark(data)
        addBookmark(createdBookmark)
        closeNewModal()
    }

    async function handleBookmarkTagRemove(id: string, tag: string) {
        const bookmark = getBookmark(id);
        if (!bookmark) return;

        const newTags = bookmark.tags.filter(t => t !== tag);
        const updatedBookmark = await API.updateBookmark(bookmark.id, {tags: newTags})
        updateBookmark(bookmark.id, updatedBookmark)
    }

    async function handleBookmarkDelete(id: string) {
        const bookmark = getBookmark(id)
        if (!bookmark) return;

        if (bookmark.collection === TopCollections.TRASH) {
            await API.removeBookmark(id)
            removeBookmark(id)
        } else {
            const updatedBookmark = await API.updateBookmark(id, {collection: TopCollections.TRASH})
            updateBookmark(id, updatedBookmark)
        }
    }

    async function handleCollectionFolding(id: string, isFolded: boolean) {
        await API.updateCollection(id, {isFolded: isFolded})
    }

    async function handleModalFetch(URL: string, forceDataRefresh: boolean): Promise<ModalFetchedWebsiteMetadata> {
        const {metadata} = await API.fetchWebsiteData(URL, forceDataRefresh)
        return {
            linkTitle: metadata.title,
            description: metadata.description,
            faviconPath: metadata.pictures.favicon?.url,
            previewPath: metadata.pictures.preview?.url
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <ThemeProvider theme={theme}>
                <GlobalStyle/>
                <TagsContext.Provider value={allTags}>
                    <Layout className="app">
                        <Sidebar mainCollections={getCollectionChildren(TopCollections.MAIN)}
                                 trashCollections={getCollectionChildren(TopCollections.TRASH)}
                                 collectionsItems={bookmarks}
                                 onCollectionAdd={handleAddCollection}
                                 onCollectionRemove={handleRemoveCollection}
                                 onTrashCollectionRemove={handleRemoveTrashCollection}
                                 afterCollectionFoldingChange={handleCollectionFolding}
                                 onSelectedCollectionChange={handleCollectionSelection}
                                 selectedCollectionId={selectedCollectionId}
                                 onDropOnCollection={handleDropOnCollection}
                                 canDropOnCollection={canDropOnCollection}/>
                        <Main>
                            <TopBar onAdd={handleBookmarkCreation}/>
                            <CollectionsBreadCrumb>
                                {slice(selectedCollectionPath, 1).map(collection => {
                                    return <CollectionName key={collection.id} name={collection.name}
                                                           icon={collection.icon}/>
                                })}
                            </CollectionsBreadCrumb>
                            <BookmarksLayout bookmarks={bookmarksToShow} onTagRemove={handleBookmarkTagRemove}
                                             onDelete={handleBookmarkDelete} onEdit={handleBookmarkEdit}/>
                        </Main>
                        <BookmarkModal
                            isOpen={isEditModalOpen}
                            onClose={closeEditModal}
                            onBookmarkSave={handleEditModalSave}
                            modalTitle="Edit bookmark"
                            initialBookmark={getBookmark(editModalBookmarkId)}
                            fetchWebsiteMetadata={handleModalFetch}/>
                        <BookmarkModal
                            isOpen={isNewModalOpen}
                            onClose={closeNewModal}
                            onBookmarkSave={handleNewModalSave}
                            modalTitle="Add new bookmark"
                            initialBookmark={newModalBookmark}
                            fetchWebsiteMetadata={handleModalFetch}/>
                    </Layout>
                </TagsContext.Provider>
            </ThemeProvider>
        </DndProvider>
    )
}
