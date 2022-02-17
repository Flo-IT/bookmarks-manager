import React, {useState} from "react";
import FolderName from "./FolderName.";
import {MdArrowDropDown, MdArrowRight} from "react-icons/md";
import styled from "styled-components";


const Wrapper = styled.div<{ isSelected: boolean }>`
  background-color: ${props => props.isSelected ? props.theme.colors.accent1 : props.theme.colors.black};
  border-radius: ${props => props.theme.radius.small};

  & & {
    padding-left: ${props => props.theme.spacing.large};
  }
`

const Container = styled.div`
  height: 35px;
  width: 100%;
  padding: 0 ${props => props.theme.spacing.big};
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`


const FoldButton = styled.button`
  border: none;
  cursor: pointer;
  background: none;
  width: 25px;
  height: 25px;

  & > svg {
    color: ${props => props.theme.colors.white};
    width: 100%;
    height: 100%;
  }
`

const Count = styled.p`
  color: ${props => props.theme.colors.whiteAlternative};
  margin-left: auto;
`

type Props = {
    folderId: string,
    name: string
    icon?: React.ComponentType,
    onClick?: (folderId: string) => void,
    isDefaultFolded?: boolean,
    children?: React.ReactNode,
    count?: number,
    isSelected?: boolean
}

export default function FolderTreeItem({
                                           folderId,
                                           name,
                                           icon,
                                           onClick,
                                           isDefaultFolded,
                                           children,
                                           count,
                                           isSelected
                                       }: Props) {
    const [isFolded, setIsFolded] = useState<boolean>(!!isDefaultFolded);

    function handleFoldButtonClick() {
        setIsFolded((isFolded) => !isFolded)
    }

    function handleItemClick() {
        onClick && onClick(folderId);
    }

    return <Wrapper isSelected={!!isSelected} data-testid={`folder-wrapper-${folderId}`}>
        <Container onClick={handleItemClick} role="button" aria-label="click folder tree item">
            {children && <FoldButton onClick={handleFoldButtonClick} aria-label="toggle children folding">
                {isFolded ? <MdArrowRight/> : <MdArrowDropDown/>}
            </FoldButton>}
            <FolderName name={name} icon={icon}/>
            {count && <Count>
                {count}
            </Count>}
        </Container>
        {!isFolded && children}
    </Wrapper>
}